import {RecoilState, SetterOrUpdater, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../state/algstate";
import * as ui from "../state/uistates";
import * as eventbus from "../state/eventbus";
import {ParametersChangedPayload} from "../state/eventbus";
import {useEffect, useState} from "react";
import {OverlayState} from "../types/uitypes";
import {abortStep} from "../eel/eel";
import {DisplayOptionSetting} from "../ui/modules/DisplayOptions";
import {ParameterKey} from "./paramtypes";
import {Task} from "../types/pipelinetypes";
import {curTaskParameterValues} from "../state/algstate";

const deepEqual = require('deep-equal')

export type StepState<ParameterType> = {
    curParams: ParameterType,
    curTask: Task,
    lastRunSettings: {params: ParameterType}
}
type AtomFamily<P> = (param: P) => RecoilState<P>


export function useStepHook<Parameters>(
    settingsAtomFamily: AtomFamily<any>,
    paramChangeListener: Record<string, (newValue, oldValue) => void> = null,
    onParamsChangedAndReadyToRun: ()=>Promise<any> = null
): StepState<Parameters> {
    
    const curParams: Parameters = useRecoilValue(alg.curTaskParameterValues) as Parameters;
    const curTask: Task = useRecoilValue(ui.selectedTask);
    const [lastRunSettings, setLastRunSettings] = useRecoilState(settingsAtomFamily(curTask.name));
    const overlay = useRecoilValue(ui.overlay);
    
    useEffect(() => {
        eventbus.unlistenTo(curTask.name)
        if (paramChangeListener) {
            eventbus.listenTo<ParametersChangedPayload>(eventbus.BaseEventTypes.ParametersChanged, curTask.name, async () => {
                //Check which parameters have changed and trigger the listeners
                var listOfChangedParams = curTask.sidebarParameters.filter((p) => lastRunSettings?.params[p.key] != curParams[p.key]);
                if (paramChangeListener) {
                    for (let pk of listOfChangedParams) {
                        if (paramChangeListener[pk.key] !== undefined)
                            paramChangeListener[pk.key](curParams[pk.key], lastRunSettings?.params[pk.key])
                    }
                }
                
                if(!overlay){
                    let changedParams = false
                    var serverRelevantKeys:string[] = curTask.sidebarParameters.map((p)=>p.frontendOnly ? null : p.key);
                    //check only those keys for changes
                    for (let paramName of serverRelevantKeys) {
                        if(!paramName) continue;
                        if(!deepEqual(curParams[paramName],lastRunSettings?.params[paramName])){
                            changedParams = true;
                            break;
                        }
                    }
                    if( changedParams && onParamsChangedAndReadyToRun){
                        onParamsChangedAndReadyToRun()
                    }
                }
                
                setLastRunSettings({params: curParams})
            })
        }
        return () => eventbus.unlistenTo(curTask.name);
    })
    
    return {
        curParams: curParams as Parameters,
        curTask: curTask,
        lastRunSettings:lastRunSettings,
    }
    
}

//
// /**
//  * Hook bundling some shared functionality of all steps. Initates input, parameters, step and overlay states.
//  * Manages listening to input and parameter changes and calls appropriate callbacks
//  * returns the current description of a more generic step state.
//  * @param settingsAtomFamily
//  * @param onInputChange
//  * @param runMainAlgorithm Will return true if all went well, or an o object containing an error description
//  * @param overlayMessageOnRun
//  * @param canAbort If true the UI will display some sort of abort button. The abortID of the process is the moduleID, which is the default parameter for runStep.
//  */
// export function useStepHook<Parameters, BatchParamType = Record<ParameterKey, any>>(
//     settingsAtomFamily: AtomFamily<any>,
//     onInputChange,
//     runMainAlgorithm: (params: Parameters) => true|Promise<true|{error:string}>,
//     overlayMessageOnRun?: OverlayState,
//     canAbort:boolean = false,
//     paramChangeListener:Record<string, (newValue,oldValue)=>void> = null
//     ): StepState<Parameters, BatchParamType> {
//
//         const curParams:Parameters = useRecoilValue(alg.curPipelineStepParameterValues) as Parameters;
//         const curStep:Step = useRecoilValue(ui.curPipelineStep) as unknown as Step;
//         const [overlay, setOverlay] = useRecoilState(ui.overlay);
//         const [lastRunSettings, setLastRunSettings] = useRecoilState(settingsAtomFamily(curStep.moduleID));
//
//         //Since this hook is only for 1 step = 1 blocking process case
//         //we use the moduleID as an identifier for the thread to kill in case of user abort
//         if(canAbort && overlayMessageOnRun)
//             overlayMessageOnRun.abortCallBack = ()=> {
//                 onInputChange();
//                 abortStep(curStep.moduleID)
//             };
//
//
//         //Wrapper for running the Algorithm, will test if inputs or parameters have changed.
//         const runAlgorithm:eventbus.ListenerFunction<void,eventbus.RunPipelineStepSyncResult> = async () => {
//             console.log(`[${curStep.moduleID}] RUNNING STEP`);
//
//             if (overlay != null) return {moduleID:curStep.moduleID, success:false, error: 'Can\'t run algorithm while overlay is active or something else is running'};
//
//             var changedParams = false;
//
//             //Call any registered parameter change listener
//             var listOfChangedParams = curStep.parameters.filter((p)=> lastRunSettings?.params[p.key] != curParams[p.key]);
//             if(paramChangeListener){
//                 for (let pk of listOfChangedParams){
//                     if(paramChangeListener[pk.key] !== undefined)
//                        paramChangeListener[pk.key](curParams[pk.key],lastRunSettings?.params[pk.key])
//                 }
//             }
//
//             //get parameter keys that are not frontendOnly
//             var serverRelevantKeys:string[] = curStep.parameters.map((p)=>p.frontendOnly ? null : p.key);
//             //check only those keys for changes
//             for (let paramName of serverRelevantKeys) {
//                 if(!paramName) continue;
//                 if(!deepEqual(curParams[paramName],lastRunSettings?.params[paramName])){
//                     changedParams = true;
//                     break;
//                 }
//             }
//
//
//             //filter out parameters that are decorative
//
//             //tell component to run algorihtm
//             if (overlayMessageOnRun) {
//                 setOverlay(overlayMessageOnRun)
//             }
//
//             //run algorithm and disable overlay
//             const algResult = await runMainAlgorithm(curParams);
//
//             setOverlay(null)
//             console.log(`[${curStep.moduleID}] COMPLETING STEP:`);
//             //Return the Result, only relevant if algorithm is run automatically inside the pipeline.
//             return <eventbus.RunPipelineStepSyncResult>{ moduleID: curStep.moduleID, success: algResult === true, error: algResult !== true ? algResult.error : null };
//         }
//
//         /**Will run the algorithm and then fire off an event upon completion. Used for automated execution.*/
//         const runAlgorithmInPipeline = async () => {
//
//             const res:eventbus.RunPipelineStepSyncResult = await runAlgorithm();
//             //additionally fire off completion event
//             eventbus.fireEvent(eventbus.EventTypes.PipelineStepCompleted,res)
//             return res;
//         }
//
//         //Register listeners for parameter change
//         useEffect(() => {
//             eventbus.unlistenTo(curStep.moduleID)
//             //in any case running the algorithm should trigger the execution completed event
//             eventbus.listenTo<void,eventbus.RunPipelineStepSyncResult>(eventbus.EventTypes.RunPipelineStepSync, curStep.moduleID, async ()=> {
//                 // console.log(`RUNNING ALG BECAUSE `,eventbus.EventTypes.RunPipelineStepSync);
//                 return runAlgorithmInPipeline();
//             })
//
//             eventbus.listenTo<ParametersChangedPayload>(eventbus.EventTypes.ParametersChanged, curStep.moduleID, async ()=> {
//                 // console.log(`RUNNING ALG BECAUSE `,eventbus.EventTypes.ParametersChanged);
//                 runAlgorithmInPipeline()
//             })
//             return () => eventbus.unlistenTo(curStep.moduleID);
//         })
//
//
//         return {
//             curParams: curParams as Parameters,
//             isRunning: !!overlay,
//             curStep: curStep,
//             setOverlay:setOverlay,
//         };
// }

/**
 * Hook for use with DisplayOption Component. Will create state for the given display options. The result can then be
 * used in the DisplayOptions component.
 * @param step The step, needed for module ID
 * @param binarySettings binarySettings of desired checkboxes
 * @return Array, first element will be a DisplayOptionSetting[], to be passed to components, then getter, setter functions for the respective elements
 * @see DisplayOptions
 export function useDisplaySettings(step:PipelineStep<any,any>, binarySettings:Record<string,(p:string) => RecoilState<boolean>>):Array<any>{
 var displayOptions:DisplayOptionSetting<any>[] = [];
 var res = []
 for (let s in binarySettings){
 const [getter,setter] = useRecoilState(binarySettings[s](step.moduleID));
 res.push(getter)
 res.push(setter)
 displayOptions.push({type:'binary', value:getter, setter:setter,label:s})
 }
 return [displayOptions].concat(res);
 }
 */


/**
 * A hook if the UI needs to be aware if a certain key is down or up. This
 * is useful to enable or disable parts of the UI like masks etc.
 * @param key The key property as it arrives in a normal keydown listener on window.
 */
export function useToggleKeys(keys: string[] | string) {
    if (!Array.isArray(keys))
        keys = [keys]
    
    const [isDown, setIsDown] = useState({});
    
    useEffect(() => {
        
        const listener = (e) => {
            for (let k of keys) {
                if (e.key == k && (e.type == 'keyup' || e.type == 'keydown')) {
                    const newVal = e.type != 'keyup'
                    if (isDown[k] == newVal) return
                    setIsDown({...isDown, [k]: newVal})
                }
            }
        }
        
        window.addEventListener('keydown', listener)
        window.addEventListener('keyup', listener)
        return () => {
            window.removeEventListener('keydown', listener)
            window.removeEventListener('keyup', listener)
        }
    })
    //in case of only a single key just return the value
    if (keys.length == 1) return isDown[keys[0]]
    //for multiple keys return an array
    return isDown
}