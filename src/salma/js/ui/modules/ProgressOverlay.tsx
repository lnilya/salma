import React, {ReactNode, useEffect, useReducer, useState} from "react";
import {ccl} from "../../util";
import '../../../scss/modules/ProgressOverlay.scss'
import * as ui from '../../state/uistates'
import {useRecoilValue} from "recoil";
import {Button, LinearProgress} from "@mui/material";
import {OverlayState} from "../../types/uitypes";

interface IProgressOverlayProps {
    /**Additional classnames for this component*/
    className?: string
    
    sidebarActive:boolean
    
}



function reducer(state:{open:boolean, overlay:OverlayState }, action:{type:string, payload?:OverlayState}) {
  switch (action.type) {
    case 'open':
        return {open:true, overlay: {...action.payload}};
    case 'close':
        return {...state, open:false };
    default:
      throw new Error();
  }
}

const cl = ccl('progress-overlay--')
/**
 * Overlay appearing when the software is busy with something.
 * @author Ilya Shabanov
 */
const ProgressOverlay: React.FC<IProgressOverlayProps> = ({sidebarActive, className}) => {
    
    const overlay = useRecoilValue(ui.overlay)
    
    //Copy the overlay state so we can animate
    const [state, dispatch] = useReducer(reducer, { open:false, overlay:null });
    const [msg, setMsg] = useState<ReactNode>('')
    const [canceled,setCanceled] = useState(false)
    
    useEffect(()=>{
        if(overlay && overlay.display != 'text' && !state.open) {
            dispatch({type: 'open', payload: overlay})
            setCanceled(false)
        }
        else if(!overlay && state.open) dispatch({type:'close'})
        if(overlay?.msg && msg != overlay?.msg)
            setMsg(overlay.msg)
    },[overlay])
    
    const abort = ()=>{
        state.overlay.abortCallBack()
        setCanceled(true)
    }
    
    return (
        <div className={(className||'') +" progress-overlay fl-row pad-200-top" + cl(state.open,'open') + cl(sidebarActive,'with-sidebar')}>
            <div className={'progress-overlay__content site-block narrow pad-200-hor'}>
                <div className={'margin-50-bottom'}>
                    {msg}
                </div>
                {state.overlay?.progress !== undefined && <LinearProgress variant="determinate" value={5 * Math.round(overlay?.progress * 20)}/>}
                {state.overlay?.progress === undefined && <LinearProgress variant="indeterminate"/> }
                {state.overlay?.abortCallBack &&
                    <div className="margin-100-top text-center">
                        <Button color={'primary'} onClick={abort} variant={'contained'} disabled={canceled}>
                            {canceled?'Waiting for Abort...':'Abort Execution'}
                        </Button>
                    </div>
                }
            </div>
        </div>
    );
}
export default ProgressOverlay;