/**Stores all states related to the state of the UI*/
import {connectedAtom, connectedSelector} from "./ConnectedStore";
import {OverlayState} from "../types/uitypes";
import {TaskName} from "../types/datatypes";
import {Task} from "../types/pipelinetypes";


/*
* States related to descriptive data of pipelines, steps and the UI.
* But does not store any actual input/parameter/output data.
* This should go in algstate.ts.
* */


//***************************************************************/
//* PIPELINES RELATED */
//***************************************************************/

/**All Pipelines the user can select*/
export const allTasks = connectedAtom<Record<TaskName,Task>>({key:'all_pipelines',default:{}});
/**The name of the current selected pipeline*/
export const selectedPipelineName = connectedAtom<TaskName>({key:'sel_pipeline_name',default:''})
/**Convenience Selector for the actual Pipeline Object*/
export const selectedTask = connectedSelector<Task>({key:'sel_pipeline',
    get:({get})=>{
        if(get(selectedPipelineName))
            return get(allTasks)[get(selectedPipelineName)]
        return null
    }})


//***************************************************************/
//* UI RELEATED */
//***************************************************************/

/**For displaying an overlay during the execution of an algorithm*/
export const overlay = connectedAtom<null|OverlayState>({key:'overlay',default:null});

export enum UIPopups{
    /**Loading Parameters*/
    paramload,
    /**Saving parameters*/
    paramsave,
}
/**Indicates an open popup*/
export const popupOpen = connectedAtom<UIPopups>({key:'popup-open',default:null});

/**Wethre or not server can be contacted*/
export const serverConnected = connectedAtom<boolean>({key:'eel_connection',default:window['eel'] !== undefined});


//***************************************************************/
//* EXPORTER */
//***************************************************************/
export enum UIScreens{
    /**Showing the pipeline in the current step*/
    pipeline,
    /**Help Screen for current pipeline*/
    pipelinehelp,
    
    /**Welcome Screen of the app*/
    welcome,
    
    /**Switch of Pipeline Screens*/
    pipelineswitch,
    
}
export const appScreen = connectedAtom<UIScreens>({key:'screen',default:UIScreens.welcome})
