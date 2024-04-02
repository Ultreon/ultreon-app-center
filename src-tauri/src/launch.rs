#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{exit, ExitStatus, Stdio};
use std::process;

use tauri::Window;

use crate::app::AppConfig;
use crate::sdk::{SDKInfo, SDKType};
use crate::util::{Error, PATH_SEPARATOR};

#[cfg(target_os = "windows")]
const DETACHED_PROCESS: u32 = 0x00000008;

pub fn run_with_sdk(window: &Window, sdk_info: &SDKInfo, cfg: &AppConfig, data_dir: &String, cp: Vec<String>) -> Result<i32, Result<i32, Error>> {
    let sdk_path = prepare_run(sdk_info, cfg, data_dir);

    println!("Running SDK: {}", sdk_path.to_string_lossy());

    let cp = cp.join(PATH_SEPARATOR);
    let code = match run_app(data_dir, &cp, cfg, sdk_path) {
        Ok(v) => v.code().unwrap_or(0),
        Err(e) => {
            window.show().expect("Failed to show window again.");
            return Err(Err(Error::Launch(format!("App Crashed: {:?}", e))));
        }
    };

    Ok(code)
}

fn prepare_run(sdk_info: &SDKInfo, cfg: &AppConfig, data_dir: &String) -> PathBuf {
    let mut sdk_path =
        PathBuf::from(data_dir).join(format!("sdks/{}/{}/", cfg.sdk.r#type, sdk_info.version));
    if sdk_info.inner_path.is_some() {
        let inner_path = sdk_info.inner_path.as_ref().unwrap();
        sdk_path = sdk_path.join(inner_path);
    }

    sdk_path = sdk_path.join("bin/java");
    sdk_path
}

//noinspection DuplicatedCode
fn run_app(
    data_dir: &String,
    cp: &String,
    cfg: &AppConfig,
    sdk_path: PathBuf,
) -> Result<ExitStatus, Error> {
    match cfg.sdk.sdk_type {
        SDKType::Java => run_java(&data_dir, &cp, &cfg, sdk_path)?,
        SDKType::Python => run_python(&data_dir, &cfg, sdk_path)?,
        SDKType::Native => run_bin(&data_dir, &cfg, sdk_path, cfg.args.clone())?,
    }
}

fn run_java(data_dir: &&String, cp: &&String, cfg: &&AppConfig, sdk_path: PathBuf) -> Result<Result<ExitStatus, Error>, Error> {
    #[allow(unused_mut)]
    #[cfg(target_os = "linux")]
    let status = process::Command::new(sdk_path)
        .args(["-cp", &cp, &cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "macos")]
    let status = process::Command::new(sdk_path)
        .args(["-cp", &cp, &cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "windows")]
    let status = process::Command::new(sdk_path)
        .args(["-cp", &cp, &cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .creation_flags(DETACHED_PROCESS)
        .spawn()?.wait()?;

    Ok(Ok(status))
}

fn run_python(data_dir: &&String, cfg: &&AppConfig, sdk_path: PathBuf) -> Result<Result<ExitStatus, Error>, Error> {
    #[allow(unused_mut)]
    #[cfg(target_os = "linux")]
    let status = process::Command::new(sdk_path)
        .args([&cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "macos")]
    let status = process::Command::new(sdk_path)
        .args([&cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "windows")]
    let status = process::Command::new(sdk_path)
        .args([&cfg.main_class.as_ref().unwrap()])
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .creation_flags(DETACHED_PROCESS)
        .spawn()?.wait()?;

    Ok(Ok(status))
}

fn run_bin(data_dir: &&String, cfg: &&AppConfig, sdk_path: PathBuf, args: Vec<String>) -> Result<Result<ExitStatus, Error>, Error> {
    #[allow(unused_mut)]
    #[cfg(target_os = "linux")]
    let status = process::Command::new(sdk_path)
        .args(&args)
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "macos")]
    let status = process::Command::new(sdk_path)
        .args(&args)
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .spawn()?.wait()?;

    #[allow(unused_mut)]
    #[cfg(target_os = "windows")]
    let status = process::Command::new(sdk_path)
        .args(&args)
        .stderr(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stdin(Stdio::inherit())
        .current_dir((&data_dir).to_string() + "/apps/" + &cfg.app)
        .creation_flags(DETACHED_PROCESS)
        .spawn()?.wait()?;

    Ok(Ok(status))
}
