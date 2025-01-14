import {getConnectedValue, updateConnectedValue} from "../state/ConnectedStore";
import * as ui from "../state/uistates";
import * as alg from "../state/algstate";
import {allTasks, UIScreens} from "../state/uistates";
import {Task} from "../types/pipelinetypes";
import {loadParameters} from "../state/persistance";
import {InputParams, Parameter, SettingDictionary} from "../modules/paramtypes";


/**
 * Initializes all selectable pipelines and sets a default pipeline
 */
export function initializePipelineStack(pipelines:Task[]) {
    var avPipelines = {}
    pipelines.forEach((p)=>{ avPipelines[p.name] = p })
    
    updateConnectedValue(allTasks, avPipelines)
}

/**
 * Changes the configuration of a task parameter. This is useful if parameters have dynamic values depending on some other state.
 * For example, a parameter can be a dropdown featuring different options depending on the working folder or similar.
 * @param changes Dictionary of changes to apply to the parameter configuration
 */
export function changeTaskParameterConfig(changes:Record<string,any>){
    
    const pn = getConnectedValue(ui.selectedPipelineName)
    const allTasks = getConnectedValue(ui.allTasks);
    const curParams = allTasks[pn].sidebarParameters;
    var curParamCopy:Array<Parameter<any>> = [...curParams]
    for(let key in changes){
        //find the index of the parameter to change
        const idx = curParamCopy.findIndex(p=>p.key == key)
        if(idx == -1) continue;
        curParamCopy[idx] = {...curParamCopy[idx],
            input: {...curParamCopy[idx].input, ...changes[key]?.input||changes[key]},
            display: {...curParamCopy[idx].display, ...changes[key]?.display||{}}
        }
    }
    
    updateConnectedValue(ui.allTasks, {...allTasks, [pn]:{...allTasks[pn], sidebarParameters:curParamCopy}})
}
/**
 * Loads the given pipeline into the UI and resets all related values.
 * @param pipe Pipeline to load
 */
export async function loadTask(pipe: Task) {
    updateConnectedValue(ui.selectedPipelineName, pipe.name)
    updateConnectedValue(ui.appScreen, UIScreens.pipeline)
    updateConnectedValue(alg.curTaskParameterValues, loadParameters(__getDefaultParameters(pipe), pipe.name))
    
}

/**Retrieves the default parameters for all steps of the pipeline*/
function __getDefaultParameters(pipe: Task): SettingDictionary {
    let stepParams = {};
    pipe.sidebarParameters.forEach((sp) => {
        stepParams[sp.key] = sp.input.defaultVal;
    })
    return stepParams;

}