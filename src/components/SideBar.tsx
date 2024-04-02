// noinspection HtmlUnknownAnchorTarget

import {MdApps, MdHome} from "react-icons/md";
import './SideBar.css';

export default function SideBar() {
    return (
        <div id="SideBar">
            <a href="#home"><MdHome/></a>
            <a href="#apps"><MdApps/></a>
        </div>
    )
}