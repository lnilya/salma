import {TaskName} from "../types/datatypes";
import {getConnectedValue} from "./ConnectedStore";
import {selectedPipelineName} from './uistates'
import {SettingDictionary} from "../modules/paramtypes";
import {__debugAllPipelineNames} from "../App";

enum keys{
    PIPELINE_PARAMS='pipelineparams',
    PIPELINE_DATA='pipelinedata',
    GLOBAL_DATA='globaldata'
}

//***************************************************************/
//* GLOBAL */
//***************************************************************/

/**Saves arbitrary data that is global for the application*/
export function saveGlobalData(data:any,key:string){
    console.log(`[persistance]: Saved Global Data for ${key}`,data);
    localStorage.setItem(keys.GLOBAL_DATA + '_' + key,JSON.stringify(data))
}
/**Loads arbitrary data that is global for the application*/
export function loadGlobalData(key:string){
    var res = localStorage.getItem(keys.GLOBAL_DATA + '_' + key)
    if(!res) return null;
    return JSON.parse(res)
}

//***************************************************************/
//* TIED TO PIPELINE */
//***************************************************************/

/**Saves arbitrary data that is tied to the given pipeline*/
export function saveDataForPipeline(data:any, key:string, pipeName:TaskName){
    if(typeof pipeName !== 'string'){
        alert(`Corruption in Recoil Pipeline Name. Provided getter/setter pair instead of name.`)
    }else if(__debugAllPipelineNames.indexOf(pipeName) == -1){
        alert(`Corruption in Recoil Pipeline Name. Could not store Pipeline Data: ${key}. Illegal PipeName: ${pipeName} `)
    }else{
       localStorage.setItem(keys.PIPELINE_DATA+'_'+pipeName+'_'+key,JSON.stringify(data))
    }
}
/**Loads arbitrary data that is tied to the given pipeline*/
export function loadDataForPipeline(key:string, pipeName:TaskName){
    var res = localStorage.getItem(keys.PIPELINE_DATA+'_'+pipeName+'_'+key)
    if(!res) return null;
    return JSON.parse(res)
}

/**
 * Stores parameters for the current pipeline
 * @param parameters The parameters to store
 * */
export function saveParameters(parameters:SettingDictionary){
    const pn = getConnectedValue(selectedPipelineName)
    console.log(`[persistance] Stored pipelineParams ${pn}`,parameters);
    localStorage.setItem(keys.PIPELINE_PARAMS+'_'+pn,JSON.stringify(parameters))
}

/***
 * Loads all Parameter sets stored for the current pipeline
 */
export function loadCurrentParameters():SettingDictionary{
    const pn = getConnectedValue(selectedPipelineName)
    var res:string = localStorage.getItem(keys.PIPELINE_PARAMS+'_'+pn);
    if(res){
        try{
            return JSON.parse(res);
        }catch (e){}
    }
    return null
}

/**
 * Loads last parameters from local storages and merges with default ones, if something has changed.
 * @param defaults A set of default parameters to merge the loaded values with. If nothing has been stored or the defaults are from
 * an older version, with less parameters, this will be necessary.
 * @param pipeName The name of the pipeline to load parameters from
 */
export function loadParameters(defaults:SettingDictionary,pipeName:TaskName):SettingDictionary{
    var storedParams:SettingDictionary = loadCurrentParameters();
    // console.log(`[persistance] Loaded PArameterSets ${pn}/${paramSetKey}`,allSets);
    if(!storedParams) return defaults;
    
    //merge, however do not add values that are not present in default parameters
    const mergedStep = {...defaults,...storedParams}
    
    console.log(`[persistance]: Loaded Pipeline(${pipeName}) Parameters: `,mergedStep);
    return mergedStep;
}