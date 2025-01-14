import React, {useEffect} from "react";
import {useRecoilValue} from "recoil";
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import ParamSlider from "../elements/ParamSlider";
import ParamTextInput from "../elements/ParamTextInput";
import ParamDropdown from "../elements/ParamDropdown";
import ParamCheckbox from "../elements/ParamCheckbox";
import * as eventbus from '../../state/eventbus'
import ParamTitle from "../elements/ParamTitle";
import {cl} from "../../util";
import {setTaskParameterValue} from "../../state/stateutil";
import {Parameter, SettingDictionary} from "../../modules/paramtypes";
import {curTaskParameterValues} from "../../state/algstate";
import ParamTreeSelection from "../elements/ParamTreeSelection";
import ParamListSelection from "../elements/ParamListSelection";

interface ISidebarProps{

}

var sbtimeout;
var oldStep = '';
const Sidebar:React.FC<ISidebarProps> = () => {

    const curStep = useRecoilValue(ui.selectedTask)
    const overlay = useRecoilValue(ui.overlay)
    const curParams:SettingDictionary = useRecoilValue(alg.curTaskParameterValues)
    
    
    //Firing of event changed
    useEffect(()=>{
        clearTimeout(sbtimeout)
        sbtimeout = setTimeout(()=> {
                eventbus.fireEvent<eventbus.ParametersChangedPayload>(eventbus.BaseEventTypes.ParametersChanged, curStep.name != oldStep)
                oldStep = curStep.name;
            }
        ,1000)
    },[curParams])
    

    const onSetParameter = (conf:Parameter<any>,value:any)=>{
        setTaskParameterValue(conf,value);
    }
    
    const overlayBlock = overlay !== null && overlay.nonBlocking !== false
    
    if(!curStep) return null;
	return (<div className={'sidebar ' + cl(overlayBlock, 'blocked')}>
        {curStep.sidebarParameters.map((s)=>{
            let vis = s.conditional(curParams);
            if( vis == 'hide') return null;
            const params = {onParameterChanged:onSetParameter, conf:s, curVal:curParams[s.key], disabled:overlayBlock|| vis == 'disable'};
            
            const k = s.key
            if(s.input.type == 'slider') return <ParamSlider {...params} key={k}/>;
            else if( s.input.type == 'text_input') return <ParamTextInput {...params} key={k}/>;
            else if(s.input.type == 'dropdown') return <ParamDropdown {...params} key={k}/>;
            else if(s.input.type == 'checkbox') return <ParamCheckbox {...params} key={k}/>;
            else if(s.input.type == 'separator') return <ParamTitle {...params} key={k}/>;
            else if(s.input.type == 'tree') return <ParamTreeSelection {...params} key={k}/>;
            else if(s.input.type == 'listselection') return <ParamListSelection {...params} key={k}/>;
            
            return null;
        }
        )}
        <div className="fl-grow"/>
        {curStep.sidebarElements &&
            <div className="sidebar-elements">
                {curStep.sidebarElements}
            </div>
        }
	</div>);
}

export default Sidebar