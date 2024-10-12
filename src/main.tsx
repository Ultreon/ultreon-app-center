import './main.css'
import * as React from 'react'
import {SwitchTransition,} from "react-transition-group";
import * as ReactDOM from 'react-dom/client'
import {createHashRouter, RouterProvider} from "react-router-dom";

import HomePage from './routes/home/HomePage.tsx'
import AppsPage from "./routes/apps/AppsPage.tsx";
import {TitleBar} from "./components/TitleBar.tsx";
import SideBar from "./components/SideBar.tsx";
import ProjectPage from "./routes/project/ProjectPage.tsx";
import {webviewWindow} from "@tauri-apps/api";

const router = createHashRouter([
    {
        path: "home",
        element: <HomePage/>,
        errorElement: <h1>Error 404</h1>,
    },
    {
        path: "apps",
        element: <AppsPage/>,
        errorElement: <h1>Error 404</h1>
    },
    {
        path: "/",
        element: <>{window.location.href = "#home"}</>
    },
    {
        path: "project",
        element: <ProjectPage/>
    },
    // {
    //     path: "*",
    //     errorElement: <h1>Error 404</h1>
    // }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <link rel="prerender" href="#"/>
        <link rel="prerender" href="#apps"/>
        {TitleBar(window.location.pathname !== "/")}
        {SideBar()}
        <SwitchTransition>
            <RouterProvider router={router}/>
        </SwitchTransition>
    </React.StrictMode>
)

// appWindow.appWindow.setTitle("Ultreon App Center").catch(e => {
//     console.error(e)
// })
