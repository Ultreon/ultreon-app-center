import {useEffect, useState} from "react";
import {Project} from "../apps/ProjectInfo.tsx";

import './ProjectPage.css';

let projectId: string | null = null
let projectObject: Project | null = null
let errorObject: string | null = null

export function clearProjectPage() {
    projectId = null
    projectObject = null
    errorObject = null
}

export default function ProjectPage(id: string) {
    const [project, setProject] = useState<Project | null>(null); // [project, setProject]
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProject = async () => {
            if (projectId !== null) {
                // window["selProjectId"] = projectId
            }
            if (projectObject !== null) {
                // window["selProjectObject"] = projectObject
                setProject(projectObject)
            }
            if (errorObject !== null) {
                // window["selErrorObject"] = errorObject
                setError(errorObject)
                return
            }
            if (projectId !== null && projectObject !== null) return
            projectId = id;
            const response = await window.fetch("https://ultreon.dev/data/project/" + id + ".json");

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
        style.background = 'url("https://ultreon.dev/data/project/' + id + '.png")';
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
                <div className="ProjectDescription">
                    <h1 className="Title">{project.name}</h1>
                    <p><i>{project.summary}</i></p>
                </div>
            </div>
        </>
    )
}