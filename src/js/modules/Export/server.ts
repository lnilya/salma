import * as eel from "../../../salma/js/eel/eel";
import {EelResponse} from "../../../salma/js/eel/eel";
import * as self from "./params";
import {getConnectedValue, updateConnectedValue} from "../../../salma/js/state/ConnectedStore";
import * as alg from "../../../salma/js/state/algstate";
import * as ui from "../../../salma/js/state/uistates";

export type ExportResult = boolean

export async function exportData():Promise<EelResponse<ExportResult>>{
    
    //Run the algorithm associated with this module
    var res:EelResponse<ExportResult> = await eel.runStep<ExportResult>(self.taskName,'loadInfo', {})

    //update pipeline, on error, delete the output again.
    // if(res.error) deletePipelineData(curStep.outputKeys.out);
    // else updatePipelineData(curStep.outputKeys.out,res.data);
    return res
}

type SingleSpecies = {
    name:string, exportableFiles:string[]
}
export type ExportFolderContent = Record<string,SingleSpecies>

export async function loadData():Promise<EelResponse<ExportFolderContent>>{
    
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    
    const curParams = {...moduleParams,"workingfolder":wf}
    
    //Run the algorithm associated with this module
    var res:EelResponse<ExportFolderContent> = await eel.runStep<ExportFolderContent>(self.taskName,'loadInfo',curParams)

    //update pipeline, on error, delete the output again.
    // if(res.error) deletePipelineData(curStep.outputKeys.out);
    // else updatePipelineData(curStep.outputKeys.out,res.data);
    return res
}

export async function runExport(type:'individual'|'all'|'single', setError:any):Promise<EelResponse<boolean>>{
    const wf = getConnectedValue(alg.asWorkingFolder)
    const moduleParams = getConnectedValue(alg.curTaskParameterValues)
    
    updateConnectedValue(ui.overlay,{msg:"Exporting...",display:"overlay",nonBlocking:false, progress:0})
    
    const curParams = {...moduleParams,"workingfolder":wf, "type":type}
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.taskName,'export',curParams)
    updateConnectedValue(ui.overlay,null)
    if(res.error) setError(res)
    else setError(null)
    return res
}