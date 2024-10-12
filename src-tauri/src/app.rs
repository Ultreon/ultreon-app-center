use std::fs::File;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::from_reader;
use crate::sdk::SDK;
use crate::util::Error;

#[derive(Debug, Deserialize, Serialize)]
pub struct AppMetadata {
    pub(crate) version: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct AppConfig {
    pub(crate) classpath: Vec<String>,
    pub(crate) sdk: SDK,
    #[serde(default)]
    pub(crate) main_class: Option<String>,
    #[serde(default)]
    pub(crate) main_file: Option<String>, // Main file.
    #[serde(default)]
    pub(crate) args: Vec<String>,
    #[serde(default)]
    pub(crate) jvm_args: Vec<String>,
    pub(crate) app: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct AppInfo {
    pub(crate) metadata: AppMetadata,
    pub(crate) config: AppConfig,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct App {
    pub(crate) name: String,
}

impl App {
    pub(crate) async fn info(&self, client: Client) -> Result<AppInfo, Error> {
        let value: AppInfo = serde_json::from_slice(
            &client
                .get("https://ultreon.dev/metadata/app/".to_owned() + &self.name + ".json")
                .send()
                .await?
                .bytes()
                .await?,
        )?;
        Ok(value)
    }
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct AppList {
    pub(crate) apps: Vec<App>,
}

pub async fn fetch_apps(client: Client) -> Result<AppList, Error> {
    let value: AppList = serde_json::from_slice(
        &client
            .get("https://ultreon.dev/metadata/apps.json")
            .send()
            .await?
            .bytes()
            .await?,
    )?;
    Ok(value)
}
