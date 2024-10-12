import { invoke } from "@tauri-apps/api/core";

export class Profile {
  app!: string;
  version!: string;
  name!: string;
}

// eslint-disable-next-line react-refresh/only-export-components
const PROFILES: Array<Profile> = [];

export async function load() {
  try {
    PROFILES.length = 0
    PROFILES.push(...(await invoke("load_profiles") as Array<Profile>));
    console.log(PROFILES)
    return PROFILES
  } catch(error) {
    console.error(error)
    return []
  }
}

export function getProfiles() {
  return PROFILES
}

console.log(PROFILES)
