// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate msgbox;

use std::fs::{File, OpenOptions};
use std::path::{Path, PathBuf};
use std::process::exit;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use serde_json::from_reader;
use tauri::{AppHandle, generate_handler, Manager, State, Window};
use tauri::api::dialog::blocking::FileDialogBuilder;

use profiles::Profiles;

use crate::profiles::Profile;
use crate::sdk::{SDKInfo, SDKList};
use crate::util::Error;

mod util;
mod launch;
mod archive;
mod sdk;
mod commands;
mod profiles;
mod net;
mod app;

#[macro_export]
macro_rules! show_error {
    ($($arg:tt)*) => {{
        println!($($arg)*);

        panic!($($arg)*);
    }};
}

#[tauri::command]
fn close() {
    exit(0);
}

#[tauri::command]
async fn launch(
    app: AppHandle,
    window: Window,
    profile: Profile,
) -> Result<i32, Error> {
    let client = net::build_client()?;

    let sdk_list: SDKList = sdk::fetch_sdk(client.to_owned())
        .await
        .map_err(|e| Error::Fetch(format!("Failed to fetch SDK: {:?}", e)))?;

    let version_dir =
        "apps/".to_string() + "/" + &profile.app + "/versions/" + &profile.version + "/";
    let cfg = profiles::read_cfg(&version_dir)
        .map_err(|e| Error::Launch(format!("Failed to read version config: {:?}", e)))?;
    let _meta = profiles::read_meta(&version_dir)
        .map_err(|e| Error::Launch(format!("Failed to read version metadata, {:?}", e)))?;
    let x = &cfg.sdk.r#type;
    let x = &mut x.clone();
    if x.as_str() == "Java" {
        x.clear();
        x.push_str("JavaJDK")
    }
    let sdk_info_map = sdk_list
        .0
        .get(x)
        .ok_or_else(|| Error::Launch(format!("Unknown SDK type: {}", x)))?;

    let mut sdk_info: Option<&SDKInfo> = None;
    let vv = util::get_version_req(&cfg)?;
    let versions = &vv;

    println!("Version range: {}", versions);
    for ele in sdk_info_map {
        let v = &ele.1.version;
        let is_newer_supported = sdk_info.is_some()
            && versions.matches(v)
            && sdk_info.unwrap().version < *v;
        let is_supported = sdk_info.is_none() && versions.matches(v);
        if (is_supported) || (is_newer_supported) {
            sdk_info = Some(ele.1);
        }
    }
    let sdk_info = sdk_info.ok_or_else(|| {
        Error::Launch(format!("No compatible versions found: {}", &x))
    })?;
    sdk::retrieve_sdk(app, client, sdk_info, &cfg, &_meta)
        .await
        .map_err(Error::Launch)?;

    let app: String = profile.app;
    let version: String = profile.version;

    let version_dir = "apps/".to_string() + "/" + &app + "/versions/" + &version + "/";

    let cfg = profiles::read_cfg(&version_dir)
        .map_err(|e| Error::Launch(format!("Failed to read version config: {:?}", e)))?;
    let meta = profiles::read_meta(&version_dir)
        .map_err(|e| Error::Launch(format!("Failed to read version metadata, {:?}", e)))?;

    let binding = util::get_data_dir();
    let data_dir_raw = binding.to_str().unwrap();
    let data_dir = &data_dir_raw
        .strip_suffix('/')
        .unwrap_or(data_dir_raw)
        .to_string();

    let cp = util::get_classpath(&cfg, meta, data_dir);

    let code = match launch::run_with_sdk(&window, sdk_info, &cfg, data_dir, cp) {
        Ok(value) => value,
        Err(value) => return value,
    };

    if code == 0 {
        return Ok(0);
    }
    Err(Error::Launch(format!("App crashed, exit code: {}", code)))
}

#[tauri::command(async)]
fn load_profiles(profile_state: State<'_, Profiles>) -> Result<Vec<Profile>, Error> {
    println!("Loading profiles.");
    let mutex_profiles = &mut profile_state.inner().0.lock()?;
    if !mutex_profiles.is_empty() {
        let mut profiles = vec![];
        for profile in mutex_profiles.iter() {
            profiles.push(profile.clone())
        }
        println!("Reusing old state.");
        return Ok(profiles);
    }

    let binding = util::get_data_dir().join("apps.json");
    let path = binding.as_path();
    if !Path::exists(path) {
        println!("Profiles data doesn't exist, returning empty vec.");
        return Ok(vec![]);
    }

    let open = OpenOptions::new().read(true).open(path)?;

    let mut profiles: Vec<Profile> = from_reader(open)?;
    mutex_profiles.append(&mut profiles);
    println!("Returning profile data.");
    Ok(profiles)
}

fn import(profile_state: State<'_, Profiles>, name: String) -> Result<Profile, Error> {
    let path_buf = FileDialogBuilder::new().pick_file();
    if path_buf.is_none() {
        return Ok(Profile {
            app: "error".to_string(),
            name: "ERROR".to_string(),
            version: "error".to_string(),
        });
    };

    let path = &path_buf
        .unwrap()
        .to_str()
        .unwrap()
        .to_string()
        .as_mut()
        .to_owned();

    let file = File::open(path)?;
    #[allow(unused_qualifications)]
        let profile = crate::profiles::list_zip_contents(&file, &name)?;
    drop(file);

    let mut profile_mutex = profile_state.inner().0.try_lock()?;
    profile_mutex.push(profile.clone());

    let path = &Path::new(&util::get_data_dir())
        .to_path_buf()
        .join("apps.json");
    let mut options = &mut OpenOptions::new();
    if !Path::exists(path) {
        options = options.create_new(true);
    }

    let open = options.write(true).open(path)?;

    let mut profiles = vec![];
    let binding = profile_mutex;
    for profile in binding.iter() {
        profiles.push(profile)
    }
    serde_json::to_writer(open, &profiles)?;

    Ok(profile)
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
struct DownloadMeta {
    name: String,
    version: String,
    download_url: String,
    last_modified: String,
}

async fn download_file(app: AppHandle, client: Client, name: &str, url: &str) -> Option<PathBuf> {
    // Download the meta file using the `url` provided
    let mut buf = Path::new(&util::get_data_dir()).to_path_buf();
    let string = format!("temp/{}", name);
    buf.push(string);
    let path = buf;
    match net::download_file(app, client, url.to_string(), path.clone()).await {
        Ok(_) => Some(path),
        Err(_) => None,
    }
}

#[tauri::command(async)]
async fn download(app_handle: AppHandle, profile_state: State<'_, Profiles>, id: String, url: String) -> Result<Profile, Error> {
    // Download the meta file using the `url` provided
    let client = reqwest::Client::new();
    let resp = client.get(url).send().await?;
    if !resp.status().is_success() {
        return Err(Error::Download("Failed to fetch download meta".to_string()));
    }
    let meta_str: String = resp.text().await?;

    if !util::get_data_dir().exists() {
        std::fs::create_dir_all(&util::get_data_dir())?;
    }
    if !util::get_data_dir().join("temp").exists() {
        std::fs::create_dir_all(&util::get_data_dir().join("temp"))?;
    }
    if !util::get_data_dir().join("sdks").exists() {
        std::fs::create_dir_all(&util::get_data_dir().join("sdks"))?;
    }
    if !util::get_data_dir().join("downloads").join(&id).exists() {
        std::fs::create_dir_all(&util::get_data_dir().join("downloads").join(&id))?;
    }

    println!("JSON: {}", meta_str);

    let meta: DownloadMeta = serde_json::from_str(&meta_str).map_err(|e| Error::Download(format!("Failed to parse download meta!")))?;

    let downloaded_file = download_file(app_handle, client, meta.name.as_str(), &meta.download_url).await;

    if downloaded_file.is_none() {
        return Err(Error::Download("Failed to download file".to_string()));
    };

    let path = &downloaded_file
        .unwrap()
        .to_str()
        .unwrap()
        .to_string()
        .as_mut()
        .to_owned();

    let file = File::open(path)?;
    let name = meta.name;

    #[allow(unused_qualifications)]
        let profile = crate::profiles::list_zip_contents(&file, &name)?;
    drop(file);

    let mut profile_mutex = profile_state.inner().0.try_lock()?;
    profile_mutex.push(profile.clone());

    let path = &Path::new(&util::get_data_dir())
        .to_path_buf()
        .join("apps.json");
    let mut options = &mut OpenOptions::new();
    if !Path::exists(path) {
        options = options.create_new(true);
    }

    let open = options.write(true).open(path)?;

    let mut profiles = vec![];
    let binding = profile_mutex;
    for profile in binding.iter() {
        profiles.push(profile)
    }
    serde_json::to_writer(open, &profiles)?;

    Ok(profile)
}

fn main() {
    let run = tauri::Builder::default()
        .setup(|app| {
            for (_, window) in app.windows() {
                window.set_title("Ultreon AppCenter").unwrap();
                window.set_maximizable(false).unwrap();
            }
            Ok(())
        })
        .manage(Profiles(Default::default()))
        .invoke_handler(generate_handler![
            close,
            launch,
            download,
            load_profiles
        ])
        .run(tauri::generate_context!());
    if run.is_err() {
        util::show_error(&run.expect_err("").to_string());
        panic!("Error Occurred");
    }
}
