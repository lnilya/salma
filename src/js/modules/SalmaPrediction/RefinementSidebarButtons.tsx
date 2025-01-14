import React from "react"
import ToolTipIconButton from "../../../salma/js/ui/elements/ToolTipIconButton";
import {FastForward} from "@mui/icons-material";
import './scss/RefinementSidebarButtons.scss'
import * as server from "./server";
import {useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../salma/js/state/algstate";
import * as self from "./params";
import {OverlayState} from "../../../salma/js/types/uitypes";
import * as ui from "../../../salma/js/state/uistates";
import * as eventbus from "../../../salma/js/state/eventbus";
interface IRefinementSidebarButtonsProps {

};
const RefinementSidebarButtons: React.FC<IRefinementSidebarButtonsProps> = () => {
    
    const curParams: self.Parameters = useRecoilValue(alg.curTaskParameterValues) as self.Parameters;
    const [overlay, setOverlay] = useRecoilState<OverlayState>(ui.overlay);
    
    const runRefine = async (force:boolean = null)=>{
        if(!curParams.species || overlay ) return
        
        setOverlay({msg:"Running...",display:"overlay",nonBlocking:false, progress:0})
        const res = await server.runBatchRefinement()
        setOverlay(null)
        eventbus.fireEvent("RefinementCompleted")
        if(res.error) eventbus.showToast(`Error during refinement: ${res.error}`,"error")
        else eventbus.showToast(`Refined ${res.data.success}/${res.data.total} images.`,"success")
    }
    
    return (<div className={"pad-50 refinement-sidebar-buttons fl-row"}>
        <ToolTipIconButton onClick={runRefine} disabled={!curParams.species} className={"full-w"} Icon={FastForward} text={"Refine all"} tooltipText={"Runs the refinement on all files using the current settings and overwriting any existing results. The images are processes in parallel using the same number of processes as available cpus."}/>
    </div>);
}
export default RefinementSidebarButtons;