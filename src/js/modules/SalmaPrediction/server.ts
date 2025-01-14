import {EelResponse} from "../../../salma/js/eel/eel";
import * as eel from "../../../salma/js/eel/eel";
import * as alg from "../../../salma/js/state/algstate";
import * as ui from "../../../salma/js/state/uistates";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../../salma/js/types/datatypes";
import {getConnectedValue, updateConnectedValue} from "../../../salma/js/state/ConnectedStore";
import {OverlayState} from "../../../salma/js/types/uitypes";

export type SingleFileInfo = {
    path:string,name:string, raw:boolean, refined:boolean
}
export type RefinementFolderContent = Record<string,Array<SingleFileInfo>>

export async function loadData(resSetter:(any)=>void):Promise<EelResponse<RefinementFolderContent>>{
    
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    
    const curParams = {...moduleParams,"workingfolder":wf,"force":false}
    
    //Run the algorithm associated with this module
    var res:EelResponse<RefinementFolderContent> = await eel.runStep<RefinementFolderContent>(self.taskName,'loadInfo',curParams)

    if (res.error) {
        resSetter(null)
    }
    resSetter(res.data)
    
    //update pipeline, on error, delete the output again.
    // if(res.error) deletePipelineData(curStep.outputKeys.out);
    // else updatePipelineData(curStep.outputKeys.out,res.data);
    return res
}

export type RefinementResult = {
    refinedImage:PipelineImage,
    rawImage:PipelineImage,
    scannedImage:PipelineImage,
    contours:PipelinePolygons,
    excludedContours:Array<number>,
    folderinfo:RefinementFolderContent,
    outdatedSettings:boolean
}

export async function runRefinement(forcerun:boolean):Promise<EelResponse<RefinementResult>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    const curParams = {...moduleParams,"workingfolder":wf, "force":forcerun}
    var res:EelResponse<RefinementResult> = await eel.runStepAsync<RefinementResult>(self.taskName,'selectimage',curParams)
    
    return res
}

export type BatchRefinementResult = {
    success:number,
    total:number
}

export async function runBatchRefinement():Promise<EelResponse<BatchRefinementResult>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    const curParams = {...moduleParams,"workingfolder":wf}
    
    var res:EelResponse<BatchRefinementResult> = await eel.runStepAsync<BatchRefinementResult>(self.taskName,'batchrefine',curParams)
    
    return res
}
export async function changePolygonChoice(excludedIDs:Array<number>):Promise<EelResponse<boolean>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    const curParams = {...moduleParams,"workingfolder":wf,"excludedIDs":excludedIDs}
    
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.taskName,'selectoutline',curParams)
    
    return res
}
