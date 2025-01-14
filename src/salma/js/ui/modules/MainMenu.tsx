import React, {useState} from "react";
import {ccl} from "../../util";
import MainMenuButton from "../elements/MainMenuButton";
import {useRecoilState, useRecoilValue} from "recoil";
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import * as ui from '../../state/uistates'
import {selectedPipelineName, UIPopups, UIScreens} from '../../state/uistates'
import '../../../scss/modules/MainMenu.scss'
import MainLogo from "../elements/MainLogo";
import TaskListEntry from "./pipelineswitchscreen/TaskListEntry";
import {loadTask} from "../../pipelines/pipeline";
import {asWorkingFolderContent} from "../../state/algstate";

interface ISideMenuProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    onChangeOpenState: (open: boolean) => void
}

/**
 * SideMenu
 * @author Ilya Shabanov
 */
const cl = ccl('main-menu--')
const MainMenu: React.FC<ISideMenuProps> = ({onChangeOpenState, className}) => {
    
    const [openPopupt, setOpenPopup] = useRecoilState(ui.popupOpen);
    const [uiState, setUIState] = useRecoilState(ui.appScreen);
    const [showing, setShowing] = useState(false);
    const allTasks = useRecoilValue(ui.allTasks);
    const wfContent = useRecoilValue(asWorkingFolderContent);
    const selTask = useRecoilValue(selectedPipelineName);

    // useEffect(()=>onChangeOpenState(showing),[showing])
    
    const onLoadSettings = () => {
        setOpenPopup(UIPopups.paramload)
    }
    const onSaveSettings = () => {
        setOpenPopup(UIPopups.paramsave)
    }
    const onSwitchPipeline = () => {
        setUIState(UIScreens.pipelineswitch)
    }
    
    
    return (
        <div className={"main-menu" + (showing ? ' is-showing' : '')} onMouseEnter={() => {
            setShowing(true)
        }} onMouseLeave={() => {
            setShowing(false)
        }}>
            <div className={`main-menu__content bg-bgdark`}>
                <MainLogo onClick={e=>setUIState(UIScreens.welcome)}/>
                <div className="margin-50-top"/>
                <MainMenuButton onClick={onSwitchPipeline} title={'Working Folder'}
                                active={uiState == UIScreens.pipelineswitch}
                                tooltip={'The working folder needs to be set first before you can use SALMA.'}
                                Icon={<LinearScaleIcon/>}/>
                {Object.keys(allTasks).map((ok)=>
                    <MainMenuButton onClick={()=>loadTask(allTasks[ok])}
                        title={allTasks[ok].name}
                        key={ok}
                        disabled={!wfContent?.species.length}
                        active={uiState == UIScreens.pipeline && selTask == ok}
                        tooltip={allTasks[ok].descriptions.description}
                        Icon={allTasks[ok].menuIcon}/>
                )}
                
            </div>
        </div>
    );
}
export default MainMenu;
