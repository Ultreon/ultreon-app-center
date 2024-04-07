import {ProjectRef} from "./ProjectInfo";

import './ProjectList.css'
import {createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {appLocalDataDir} from "@tauri-apps/api/path";
import {clearProjectPage} from "../routes/project/ProjectPage.tsx";

let PROJECT_JSON: Array<ProjectRef> = []

window.fetch("https://ultreon.github.io/projects.json").then(response => response.json()).then(data => {
    PROJECT_JSON = data
})

export function ProjectList() {
    return (
        <div className="ProjectList">
            {PROJECT_JSON.filter(p => p.category === "misc" || p.category === "games").map(project => {
                return (
                    <a tabIndex={10} onClick={
                        async () => {
                            clearProjectPage()
                            let parsed;
                            const dir = await appLocalDataDir() + "temp/";
                            if (!await exists(dir)) {
                                await createDir(dir, {
                                    recursive: true
                                });
                            }
                            try {
                                if (await exists(dir + "page-open-intent.json"))
                                    parsed = JSON.parse(await readTextFile(dir + "page-open-intent.json"));
                                else parsed = {}
                            } catch (error) {
                                console.error(error)
                                parsed = {}
                            }
                            parsed["cur-project-id"] = project.id;

                            try {
                                await writeTextFile(dir + "page-open-intent.json", JSON.stringify(parsed));
                            } catch (error) {
                                console.error(error)
                                return
                            }
                            window.location.href = "#project"
                        }} className="ProjectEntry" key={project.id} data-project-id={project.id} rel="nofollow">
                        <span className="Icon"
                              style={{background: 'url("https://ultreon.github.io/data/project/icon-' + project.id + '.png")'}}></span>
                        <div className="Details">
                            <p className="Title">{project.name}</p>
                            <p className="Summary">{project.summary}</p>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}