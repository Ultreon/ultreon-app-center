import {exists, readTextFile} from "@tauri-apps/api/fs";
import {useEffect, useState} from "react";
import {Project} from "../../apps/ProjectInfo.tsx";

import './ProjectPage.css';
import {invoke} from "@tauri-apps/api";
import {appLocalDataDir} from "@tauri-apps/api/path";

async function downloadProject(id: string) {
    const meta_url = "https://ultreon.github.io/cdn/project/" + id + ".dl_meta.json"

    try {
        await invoke("download", {id: id, url: meta_url})
    } catch (error) {
        alert(error)
    }
}

let projectId: string | null = null
let projectObject: Project | null = null
let errorObject: string | null = null

export function clearProjectPage() {
    projectId = null
    projectObject = null
    errorObject = null
}

export default function ProjectPage() {
    const [id, setId] = useState<string>("");
    const [project, setProject] = useState<Project | null>(null); // [project, setProject]
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProject = async () => {
            if (projectId !== null) {
                // window["projectId"] = projectId
                setId(projectId)
            }
            if (projectObject !== null) {
                // window["projectObject"] = projectObject
                setProject(projectObject)
            }
            if (errorObject !== null) {
                // window["errorObject"] = errorObject
                setError(errorObject)
                return
            }
            if (projectId !== null && projectObject !== null) return
            const dir = await appLocalDataDir() + "temp";
            if (!await exists(dir + "/page-open-intent.json")) return
            let parsed;
            try {
                parsed = JSON.parse(await readTextFile(dir + "/page-open-intent.json"));
            } catch (error) {
                console.error(error)
                setError(error?.toString() ?? "Unknown error");
                errorObject = error?.toString() ?? "Unknown error";
                return
            }
            setId(parsed["cur-project-id"] as string);
            projectId = parsed["cur-project-id"] as string;
            const response = await window.fetch("https://ultreon.github.io/data/project/" + parsed["cur-project-id"] + ".json");

            if (!response.ok) {
                setError("Fetch returned status " + response.status);
                errorObject = "Fetch returned status " + response.status;
                return
            }
            const PROJECT_JSON = await response.json()
            setProject(PROJECT_JSON as Project);
            projectObject = PROJECT_JSON as Project;
        }
        loadProject().then(() => {

        })

    }, [project, id]);

    const style = {background: "#0004"} as React.CSSProperties;
    const style1 = {background: "#0004"} as React.CSSProperties;

    if (project === null || id == "") {
        return (
            <>
                <div className="ProjectInfo" style={style1}>
                    <div className="ProjectSideBar">
                        <span className="ProjectBanner" style={style}/>
                        <span className="ProjectIcon" style={style}/>
                        <button className="ProjectButton Disabled">Loading...</button>
                        <p className="ProjectDetail">Stage: <span className="ProjectDetailValue">Loading...</span></p>
                        <p className="ProjectDetail">Version: <span className="ProjectDetailValue">Loading...</span></p>
                    </div>
                    <div className="ProjectDescription">
                        <h1 className="Title">Loading...</h1>
                        <p><i>Loading...</i></p>
                    </div>
                </div>
            </>

        )
    } else if (error !== null) {
        return (
            <>
                <div className="ProjectInfo" style={style}>
                    <h1>Error: {error}</h1>
                </div>
            </>
        )
    } else if (project.background === 'image') {
        style.background = 'url("https://ultreon.github.io/data/project/' + id + '.png")';
        style.backgroundSize = "cover"
    } else {
        style1.background = project.background?.toString();
    }

    style.position = "fixed";
    style.height = (128) + "px";
    style.width = "300px";
    style.zIndex = -2;
    style.borderRadius = "8px";

    return (
        <>
            <div className="ProjectInfo" style={style1}>
                <div className="ProjectSideBar">
                    <span className="ProjectBanner" style={style}/>
                    <img className="ProjectIcon" src={"https://ultreon.github.io/data/project/icon-" + id + ".png"}
                         alt="ProjectIcon"/>
                    <button className={project.comingSoon || project.deprecated ? "ProjectButton Disabled" : "ProjectButton"} onClick={() => project.comingSoon || project.deprecated ? null : downloadProject(id)}>{project.comingSoon ? "Coming Soon" : project.deprecated ? "Deprecated" : "Install"}</button>
                    <p className="ProjectDetail">Stage: <span
                        className="ProjectDetailValue">{(project.comingSoon ? "In Development" : project.deprecated ? "Deprecated" : project.stage === "alpha" ? "Alpha" : project.stage === "beta" ? "Beta" : "Release")}</span>
                    </p>
                    <p className="ProjectDetail">Version: <span
                        className="ProjectDetailValue">v{project.version === undefined ? "0.0.0" : project.version}</span>
                    </p>
                </div>
                <div className="ProjectDescription">
                    <h1 className="Title">{project.name}</h1>
                    <p><i>{project.summary}</i></p>
                </div>
            </div>
        </>
    )
}