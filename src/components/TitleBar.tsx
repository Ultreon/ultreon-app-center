import {invoke} from "@tauri-apps/api";
import {
    MdKeyboardArrowLeft, MdKeyboardArrowRight,
    MdOutlineClose,
    MdShoppingBag
} from "react-icons/md";
function CloseButton() {
    function Close(): void {
        invoke("close").then(() => {
            
        })
    }

    return (
        <button className="TitleButton Icon End" onClick={Close} type="button">
            <MdOutlineClose style={{fontSize: "20px", margin: 0, padding: 0}}/>
        </button>
    );
}

function BackButton() {
    function Back(): void {
        window.history.back()
    }

    return (
        <button className="TitleButton Icon End" onClick={Back} type="button">
            <MdKeyboardArrowLeft style={{fontSize: "20px", margin: 0, padding: 0}}/>
        </button>
    );
}

function ForwardButton() {
    function Back(): void {
        window.history.forward()
    }

    return (
        <button className="TitleButton Icon End" onClick={Back} type="button">
            <MdKeyboardArrowRight style={{fontSize: "20px", margin: 0, padding: 0}}/>
        </button>
    );
}
function TitleButtonsOther() {
    return (
        <div>
            <TitleBarText/>
            <MdShoppingBag className="TitleLogo" style={{fontSize: "28px", margin: 0, padding: 0}}/>
            <div className="TitleButtonsOther" data-tauri-drag-region>
                <div className="TitleButtonStart">
                <div className='TitleButtonGroup Begin'>
                    <div className="TitlesSpace"/>
                    {BackButton()}
                    {ForwardButton()}
                </div>
                {/*<div className='TitleButtonGroup '>*/}
                {/*    {ImportButton()}*/}
                {/*</div>*/}
                </div>
                <CloseButton/>
            </div>
        </div>
    );
}

function TitleBarText() {
    return (
        <div>
            <p className="TitleBarText" data-tauri-drag-region="true">
                Ultreon AppCenter
            </p>
        </div>
    );
}

export function TitleBar(background: boolean = false) {
    return (
        <div className={background ? "TitleBar Background" : "TitleBar"} data-tauri-drag-region="true">
            {TitleButtonsOther()}
        </div>
    );
}
