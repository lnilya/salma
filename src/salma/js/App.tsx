import React, {useEffect, useState} from "react";
import Footer from "./ui/modules/Header";
import Sidebar from "./ui/modules/Sidebar";
import * as ui from './state/uistates';
import {UIPopups, UIScreens} from './state/uistates';
import * as alg from './state/algstate';
import {useRecoilValue} from "recoil";
import {cl} from "./util";
import MainMenu from "./ui/modules/MainMenu";
import TaskSwitchScreen from "./ui/modules/TaskSwitchScreen";
import {Alert} from "@mui/material";
import {BaseEventTypes, EventTypes, listenTo, ToastEventPayload} from "./state/eventbus";
import {useSnackbar} from "notistack";
import ProgressOverlay from "./ui/modules/ProgressOverlay";
import WelcomeScreen from "./ui/modules/WelcomeScreen";
import {Task} from "./types/pipelinetypes";
import {initializePipelineStack} from "./pipelines/pipeline";

interface IApp{
    getPipelineDefinitions:()=>Task[]
}

/**Debugging Recoil issue with retrieving pipeline names*/
export var __debugAllPipelineNames:string[];

const App: React.FC<IApp> = ({getPipelineDefinitions}) => {
    const overlay = useRecoilValue(ui.overlay);
    const curStep = useRecoilValue(ui.selectedTask)
    const uiStep = useRecoilValue(ui.appScreen)
    const openPopup = useRecoilValue(ui.popupOpen);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    const [sideMenuOpen,setSideMenuOpen] = useState(false);
    
    useEffect(() => {
        const pd = getPipelineDefinitions();
        __debugAllPipelineNames = pd.map((pl)=>pl.name);
        initializePipelineStack(pd);
        listenTo<ToastEventPayload>(BaseEventTypes.ToastEvent, 'apptoast', (data) => {
            enqueueSnackbar(data.msg,{content:<Alert severity={data.severity}>{data.msg}</Alert>})
        })
    }, [])
    
    // if (!curStep) return null
    const showSidebar = uiStep == UIScreens.pipeline && curStep?.sidebarParameters?.length > 0;
    
    return(
            <div className={"app " + (cl(sideMenuOpen,'app--side-menu-open'))}>
    
                <MainMenu onChangeOpenState={s=>setSideMenuOpen(s)}/>
                {curStep &&  <ProgressOverlay sidebarActive={showSidebar}/> }
                {showSidebar && <Sidebar/>}
                <div className={`inner`}>
                    <div className={`main pad-100 rel` + cl(showSidebar, 'has-sidebar')}>
                        {uiStep == UIScreens.pipeline && curStep.renderer}
                        {uiStep == UIScreens.pipelineswitch && <TaskSwitchScreen/>}
                        {uiStep == UIScreens.welcome && <WelcomeScreen/>}
                    </div>
                </div>
                <Footer/>
            </div>
    );
}
export default App;
