import React from "react"
import {useRecoilState, useRecoilValue} from "recoil";
import * as ui from '../../state/uistates'
import {UIScreens} from '../../state/uistates'
import {Tooltip} from "@mui/material";

interface IStepChoiceProps{
    className?:string
}



const Header:React.FC<IStepChoiceProps> = ({className}) => {
 
    const cpn = useRecoilValue(ui.selectedPipelineName)
	const [uiStep,setUIStep] = useRecoilState(ui.appScreen)
    
    var inputName = '';
    var tooltip = null;
    
	return (<div className={'header ' + className}>
        {uiStep == UIScreens.pipeline &&
        <>
            <Tooltip title={tooltip} arrow placement={'bottom'}>
                <span className={'header__batch-num text-tooltip'}>{cpn}</span>
            </Tooltip>
        </> }
        {uiStep == UIScreens.pipelineswitch && <div className="text-center header__title">Choose Pipeline</div> }
        
	</div>);
}

export default Header