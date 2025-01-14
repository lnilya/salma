
//***************************************************************/
//* ALL STATES RELATED TO THE ALGORITHM */
//***************************************************************/


/*
 * Statemodel always has the current parameters of an algorithm in one atom.
 * When we migrate from one step to the other this atom is replaced and has different data.
 * The total state of all settings is stored inside another object and is through this accessible.
 * The results are being stored yet again separately by step.
 *
 */

import {connectedAtom, connectedSelector} from "./ConnectedStore";
import * as ui from './uistates'
import {atom, selector} from "recoil";
import {ParameterKey, SettingDictionary} from "../modules/paramtypes";
//
// /**Values of all parameters of the current step, keys are set inside the steps module definition and should
//  * only be relevant to the respective step. Will not contain uiOnly Steps*/
// export const curPipelineStepParameterValues = selector<SettingDictionary | null>({
//     key: 'cur_params',
//     get: ({get}) => {
//         var csn = get(ui.curPipelineStepNum);
//         const allParams = get(curPipelineParameterValues);
//         var step = get(curPipelineStep);
//         if (csn >= 0 && csn < allParams.length) {
//             //filter out uiOnly parameters
//             var ret = {};
//             for (let pkey in allParams[csn]) {
//                 const isValidParam = !!step.parameters.find((p)=>p.key == pkey && !p.uiOnly)
//                 if(isValidParam)
//                     ret[pkey] = allParams[csn][pkey]
//              }
//             return ret
//         }
//         //filter out uionly parameters
//         return null;
//     }
// });
// /**Values of all parameters of the current step, keys are set inside the steps module definition and should
//  * only be relevant to the respective step.*/
// export const curPipelineStepParameterValuesUI = selector<SettingDictionary | null>({
//     key: 'cur_params_ui',
//     get: ({get}) => {
//         var csn = get(ui.curPipelineStepNum);
//         var allParams = get(curPipelineParameterValues);
//         var step = get(curPipelineStep);
//         if (csn >= 0 && csn < allParams.length)
//             return allParams[csn]
//         return null;
//     }
// });


/**Stores all the parameter values for all steps of the current pipeline as one dictionary. This is
 * used to persist state.*/
export const curTaskParameterValues = connectedAtom<SettingDictionary>({key:'all_params',default:[]})


export type PipelineLogEntry = {msg:string,type:'success'|'fail'|'info',duration:number|null, time:number};
export const pipelineLog = connectedAtom<PipelineLogEntry[]>({key:'pl_log',default:[]})

//***************************************************************/
//* SALMA */
//***************************************************************/

export type WorkingFolderContents = {folder:string, species:string[], numFiles: Record<string,number>};
export const asWorkingFolder = connectedAtom<string>({key: 'working_folder', default: ""});
export const asWorkingFolderContent = atom<WorkingFolderContents>({key: 'working_folder_content', default: null});
//
// export const asGlobalParams = connectedSelector<SettingDictionary | null>({
//     key: 'global_params',
//     get: ({get}) => {
//         console.log("get global params")
//         return {
//             "workingfolder": get(asWorkingFolder)
//         }
//     }
// });