import {ProjectRef} from "./ProjectInfo";

import './ProjectList.css'
import {mkdir, exists, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {appLocalDataDir} from "@tauri-apps/api/path";
import {clearProjectPage} from "../routes/project/ProjectPage.tsx";
import {logError} from "@tauri-apps/cli/index";

let PROJECT_JSON: Array<ProjectRef> = []

window.fetch("https://ultreon.dev/projects.json").then(response => response.json()).then(data => {
    PROJECT_JSON = data
})

export function ProjectList() {
    return (
        <div className="ProjectList">
            {PROJECT_JSON.filter(p => p.category === "misc" || p.category === "games").map(project => {
                return (
                    <a tabIndex={10} onClick={
                        async () => {
                            try {
                                clearProjectPage()
                                let parsed;
                                const dir = await appLocalDataDir() + "/temp/";
                                if (!await exists(dir)) {
                                    await mkdir(dir, {
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
                            } catch (e) {
                                console.error(e)
                            }
                        }} className="ProjectEntry" key={project.id} data-project-id={project.id} rel="nofollow">
                        <span className="Icon"
                              style={{background: 'url("https://ultreon.dev/data/project/icon-' + project.id + '.png")'}}></span>
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