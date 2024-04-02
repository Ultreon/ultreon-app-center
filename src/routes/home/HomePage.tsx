import {MouseEvent, ReactElement, useEffect, useState} from 'react';
import './HomePage.css';
import {invoke} from '@tauri-apps/api'
import {listen} from '@tauri-apps/api/event'
import {load, Profile, PROFILES} from '../../util/Profiles.tsx';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ToastComponent from "../../components/CustomToast.tsx";

let selectedProfile: Profile | null = null;

document.oncontextmenu = e => {
    e.preventDefault()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let onprogress = (_payload: DownloadInfo) => {
};

listen('downloadProgress', (progress) => {
    onprogress(progress.payload as DownloadInfo)
});

function PlayButton() {
    async function Launch(event: MouseEvent<HTMLButtonElement>): Promise<void> {
        const elem = event.target as HTMLButtonElement;
        if (elem.classList.contains('Disabled')) return;
        const PROF = selectedProfile
        if (PROF == null) return;

        RevalidatePlayState(null);
        try {
            await invoke("launch", {profile: PROF})
        } catch (e) {
            if (typeof (e) === "string") {
                toast.error((
                    <>
                        <b>Failed to launch!</b><br/>{e.toString()}
                    </>
                ), {
                    position: toast.POSITION.TOP_RIGHT,
                    closeOnClick: true,
                    theme: "dark"
                });
            }
            console.log("Launch failed:", e);
        }
        RevalidatePlayState(PROF);
    }

    return (
        <div>
            <button
                id="PlayButton"
                className="Button Disabled"
                onClick={Launch}
                type="button"
            >
                Launch
            </button>
        </div>
    );
}

function BottomPanel() {
    return (
        <div>
            <div className="BottomPanel">
                <PlayButton/>
            </div>
        </div>
    );
}

function ProfileEntry(element: Profile, selected: boolean, onClick: (profile: Profile) => void): ReactElement {
    async function SelectProfile(event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
        console.log(event.currentTarget.ariaLabel);
        if (event.currentTarget.classList.contains('Disabled')) return;

        const elem = event.currentTarget
        if (PROFILES.length === 0) await load();
        const app = PROFILES.find(value => value.app == elem.ariaLabel)
        selectedProfile = app === undefined ? null : app;

        if (selectedProfile === null) {
            RevalidatePlayState(null);
            console.log("No profile selected")
            return;
        }

        RevalidatePlayState(selectedProfile)
        onClick(selectedProfile)
    }

    return (
        <button className={selected ? "ProfileEntry Selected" : "ProfileEntry"} aria-label={element.app} key={element.app} type="button"
                onClick={SelectProfile}>
            {element.name}
        </button>
    );
}

function Content(list: ReactElement<HTMLDivElement>, modal: ReactElement<HTMLDivElement>, progress: ReactElement<HTMLDivElement>) {
    return (
        <div>
            <div>
                {list}
            </div>
            <div>
                {modal}
            </div>
            {progress}
            {BottomPanel()}
            <ToastComponent/>
        </div>
    );
}

function hideModal() {
    const modal = document.getElementById("InputModalBG");
    modal?.classList.remove("Shown");

    const elem = document.getElementById("InputModal") as HTMLDivElement;
    const inputElem = elem.getElementsByClassName("textInput")[0] as HTMLInputElement;
    inputElem.value = "";
}

class DownloadInfo {
    downloaded: number = 0;
    total: number = 0;
    percent: number = 0;
    downloading: boolean = false;
    status: string = "";

    constructor() {

    }
}

export default function HomePage() {
    const [items, setItems] = useState<Profile[]>(PROFILES);
    const [newItem, setNewItem] = useState<Profile | null>(null);
    const [progress, setProgress] = useState<DownloadInfo>(new DownloadInfo());
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                if (PROFILES.length === 0) await load();

                setItems(PROFILES);
            } catch (error) {
                console.error('Error loading profiles:', error);
            }
        };

        loadProfiles().then(() => {
        });
    }, []);

    useEffect(() => {
        if (newItem !== null) {
            setItems((prevItems) => {
                return [...prevItems, newItem];
            });
            setNewItem(null);
        }
    }, [newItem]);

    const LIST = (
        <div id="SidePanel">
            {items.filter((item, pos, self) => self.findIndex(it => item.name == it.name) == pos).map((profile) => ProfileEntry(profile, selectedProfile === profile, setSelectedProfile))}
        </div>
    )

    async function importProfile(name: string) {
        try {
            console.log("Attempting to import profile:" + name);
            const profile: Profile = await invoke("import", {name: name}) as Profile
            if (profile.app === 'error') {
                console.log("Importing cancelled");
                return;
            }

            console.log("Imported profile: %s", profile.name);
            if (PROFILES.length === 0) await load();
            PROFILES.push(profile);
            console.log(PROFILES);

            setNewItem(profile)
            hideModal();
        } catch (e) {
            console.error(e)
        }
    }

    const MODAL = (
        <div id="InputModalBG" className='ModalBackground'>
            <div id="InputModal" className='Modal'>
                <input type='text' className='textInput'/>
                <div className='ButtonGroup'>
                    <button type='button' onClick={() => hideModal()}>Cancel</button>
                    <button type='button' onClick={() => submitProfileInput(importProfile)}>Import</button>
                </div>
            </div>
        </div>
    )

    useEffect(() => {
        onprogress = (payload: DownloadInfo) => {
            setProgress(payload);
        };
    }, []);

    const PROGRESS = (
        <div className={progress.downloading ? 'ProgressBar Shown' : 'ProgressBar'}>
            <div id="MainProgressBar" className='ProgressBarInner' style={{width: (progress.percent) + "%"}}/>
            <div id="MainProgressStatus" className='ProgressStatus'>
                {progress.status}
            </div>
        </div>
    )

    return (
        <>
            {Content(LIST, MODAL, PROGRESS)}
        </>
    );
}

function RevalidatePlayState(selectedProfile: Profile | null) {
    const elem = document.getElementById("PlayButton");
    if (selectedProfile === null) {
        console.log("No profile selected")
        elem?.classList.add("Disabled")
    } else {
        console.log("Selected Profile: " + selectedProfile.name);
        elem?.classList.remove("Disabled")
    }
}

function submitProfileInput(importFunc: (name: string) => Promise<void>): void {
    const elem = document.getElementById("InputModal") as HTMLDivElement;
    const inputElem = elem.getElementsByClassName("textInput")[0] as HTMLInputElement;
    const value = inputElem.value;
    if (value.trim() === '') {
        console.info('Empty name value!')
        return;
    }
    console.log("Import for: %s", value)
    importFunc(value);
}
