import {EelResponse} from "../../../salma/js/eel/eel";
import * as eel from "../../../salma/js/eel/eel";
import * as alg from "../../../salma/js/state/algstate";
import * as ui from "../../../salma/js/state/uistates";
import * as self from "./params";
import {PipelineImage} from "../../../salma/js/types/datatypes";
import {getConnectedValue, updateConnectedValue} from "../../../salma/js/state/ConnectedStore";
import {OverlayState} from "../../../salma/js/types/uitypes";

export type SalmaTrainingResult = {
    modelInfo: string
}
export async function runTraining(species:string[]):Promise<EelResponse<SalmaTrainingResult>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    const curParams = {...moduleParams,"workingfolder":wf, "species":species}
    
    const uiState:OverlayState ={
        msg: 'Running Training',
        display: "overlay",
        progress:0,
        nonBlocking:false,
        abortCallBack:()=>{eel.abortStep(self.taskName)}
    }
    updateConnectedValue(ui.overlay,uiState)
    var res:EelResponse<SalmaTrainingResult> = await eel.runStep<SalmaTrainingResult>(self.taskName,'training',curParams)
    updateConnectedValue(ui.overlay,null)
    return res
    // return {error:null,data:null}
}
export async function runPredictions(species:string[]):Promise<EelResponse<SalmaTrainingResult>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    const curParams = {...moduleParams,"workingfolder":wf, "species":species}
    
    const uiState:OverlayState ={
        msg: 'Running Prediction',
        display: "overlay",
        progress:0,
        nonBlocking:false,
        abortCallBack:()=>{eel.abortStep(self.taskName)}
    }
    updateConnectedValue(ui.overlay,uiState)
    var res:EelResponse<SalmaTrainingResult> = await eel.runStepAsync<SalmaTrainingResult>(self.taskName,'prediction',curParams)
    updateConnectedValue(ui.overlay,null)
    return res
    // return {error:null,data:null}
}
export async function initFolder(resSetter:(any)=>void):Promise<EelResponse<SalmaTrainingResult>>{
    
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    
    const curParams = {...moduleParams,"workingfolder":wf}
    
    
    const uiState:OverlayState ={
        msg: 'Loading Working Folder (may take a while on first run...)',
        display: "overlay",
        progress:undefined,
        nonBlocking:false,
    }
    updateConnectedValue(ui.overlay,uiState)
    var res:EelResponse<SalmaTrainingResult> = await eel.runStep<SalmaTrainingResult>(self.taskName,'loadAndCreate',curParams)
    updateConnectedValue(ui.overlay,null)
    //Run the algorithm associated with this module

    if (res.error) {
        resSetter(null)
    }
    resSetter(res.data)
    
    //update pipeline, on error, delete the output again.
    // if(res.error) deletePipelineData(curStep.outputKeys.out);
    // else updatePipelineData(curStep.outputKeys.out,res.data);
    return res
}