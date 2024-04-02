import {ProjectList} from "../../apps/ProjectList.tsx";
import "./AppsPage.css";

export default function AppsPage() {
    return (
        <div style={{justifySelf: "start"}}>
            {ProjectList()}
        </div>
    )
}