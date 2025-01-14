//***************************************************************/
//* TYPING OF THE JS->PYTHON INTERFACE */
//***************************************************************/

import {
    LocalFile,
    LocalFilePath,
    LocalFileWithPreview,
    LocalFolder,
    PipelineDataAggregatorID,
    PipelineDataKey
} from "../types/datatypes";
import {addExecutionCallback} from "./eelJsFunctions";
import {Task} from "../types/pipelinetypes";
import {ModuleID} from "../types/uitypes";
import {ParameterKey} from "../modules/paramtypes";
import {WorkingFolderContents} from "../state/algstate";

export type EelThreadKey = string

/**List of all currently implement server functions*/
enum EelPythonFunctions {
    
    /** Runs a Module Step in main thread on server, discouraged */
    runStep = 'runStep',
    
    /** Runs a Module Step in separate thread on server*/
    runStepAsync = 'runStepAsync',
    
    /**Request to abort a currently running step and kill the thread, only for async steps*/
    abortStep = 'abortStep',
    
    /**Retrieve contens of a given folder*/
    getFolderContents = 'getFolderContents',
    
    /**Sets the working folder where the outputs will be stored and the source files come from*/
    setWorkingFolder = 'setWorkingFolder',
    
    /**Retrieves batches by globs for data input*/
    getBatchGlobs = 'getBatchGlobs',
    
    /**Reset server state by loading new pipeline data*/
    onNewPipelineLoaded = 'onNewPipelineLoaded',
    
    /**Export a given piece of Data*/
    exportData = 'exportData',
    
}

/**A generic server response object response, to avoid try catch for server errors.
 * Will either hava data set or error and errorTrace .*/
export type EelResponse<T> = Partial<{
    error: string,
    errorTrace: string[],
    data: T
}>;

const eel = window['eel'];

//***************************************************************/
//* PUBLIC API FOR REST OF REACT APP                            */
//***************************************************************/

export async function abortStep(threadID: EelThreadKey): Promise<any> {
    return runEelEndpoint(EelPythonFunctions.abortStep, [threadID]);
}

/**
 * Runs an algorithm Step in a separate thread on server. This is the preferred way of doing this.
 * However for matplotlib you need to be in the main thread on server and crashes might occur. So The sync
 * method is still present.
 * @param moduleName
 * @param action
 * @param params
 * @param customThreadID
 */
export async function runStepAsync<T>(moduleName: string, action: string, params: any, customThreadID: EelThreadKey = null): Promise<EelResponse<T>> {
    const args = [moduleName,
        action,
        params
        ]
    return runEelEndpointAsync<T>(customThreadID || moduleName, EelPythonFunctions.runStepAsync, args);
}

/**
 * Will run an algorithm step on server, in the main thread. i.e. server will be not responsible for the time being.
 * This might be needed if the server side algorithm in some way relies on being inside the main thread
 * If possible use runStepAsync instead. The behaviour is identical to the rest of the Frontend.
 * @param moduleName
 * @param action
 * @param params
 * @param step
 */
export async function runStep<T>(moduleName: string, action: string, params: any): Promise<EelResponse<T>> {
    const args = [moduleName,
        action,
        params];
    return runEelEndpoint<T>(EelPythonFunctions.runStep, args);
}

// export async function onLoadNewPipeline(pn: Pipeline): Promise<EelResponse<boolean>> {
//     var serverParams = {}
//     //Extract parameters for the single modules
//     pn.steps.forEach((ps) => {
//         serverParams[ps.moduleID] = ps.serverParameters || {}
//     })
//     return runEelEndpoint<boolean>(EelPythonFunctions.onNewPipelineLoaded, [pn.name, serverParams]);
// }

export async function getBatchGlobs(patterns: string[], extensions: string[][]): Promise<EelResponse<LocalFile[][]>> {
    return await runEelEndpoint<LocalFile[][]>(EelPythonFunctions.getBatchGlobs, [patterns, extensions])
}

/**
 * Runs a data exporter in the given module ID
 * @param moduleID The moduleID to execute the export
 * @param pipelinekey The key of the export object
 * @param filePath The user deined filepath where the export goes to
 * @param overwrite If true, will overwrite existing file
 * @param batchSettings The settings for this batch, set in the data input screen.(e.g. An image scale parameter "1px = 23.4µm")
 * @param addtlParams A dictionary of additional parameters the exporter might need, these are set in pipeline definition and passed automatically.
 * @return An eelresponse with error information or simply "true" if it went alright.
 */
export async function exportData(moduleID: ModuleID, pipelinekey: PipelineDataKey, filePath: LocalFilePath, overwrite: boolean, batchSettings: Record<ParameterKey, any> = null, addtlParams = null): Promise<EelResponse<boolean>> {
    const params = {...addtlParams||{}, ...batchSettings||{}}
    return await runEelEndpoint<boolean>(EelPythonFunctions.exportData,
        [moduleID, pipelinekey, filePath, overwrite, params])
}


type FolderContents = { files: LocalFile[], folders: LocalFolder[] };

export async function getFolderContents(folder: string, extensions: string[] = null): Promise<EelResponse<FolderContents>> {
    return await runEelEndpoint<FolderContents>(EelPythonFunctions.getFolderContents, [folder, extensions])
}


export async function setWorkingFolder(folder: string): Promise<EelResponse<WorkingFolderContents>> {
    return await runEelEndpoint<WorkingFolderContents>(EelPythonFunctions.setWorkingFolder, [folder])
}


//***************************************************************/
//* CORE FUNCTIONS HANDLING THE EEL COMMUNICATION */
//***************************************************************/

function parseEelError<T>(err: { errorText: string, errorTraceback: string }): EelResponse<T> {
    return {
        error: err.errorText,
        errorTrace: err?.errorTraceback?.split('\n') || ['No Stacktrace available.']
    }
}

const debug = true;
var num = 0;

async function runEelEndpointAsync<T>(threadID: EelThreadKey, endpoint: EelPythonFunctions, params: any = {}): Promise<EelResponse<T>> {
    if (!eel) return {error: 'Eel Not initialized', errorTrace: []};
    var curExec = num++;
    debug && console.log(`[runEelEndpointAsync ${curExec}]: Contacting ${endpoint} in thread ${endpoint} with params:`, params);
    try {
        
        //Start execution
        await eel[endpoint](threadID, ...params)();
        
        //wait for the eel process to send a callback
        var data = await new Promise<T>((resolve, reject) => {
            addExecutionCallback(threadID, resolve, reject)
        })
        
        debug && console.log(`[runEelEndpointAsync ${curExec}]: Completed ${endpoint}, result:`, data);
        
    } catch (e) {
        debug && console.log(`[runEelEndpointAsync ${curExec}]: ERROR ${e.errorText}`);
        return parseEelError<T>(e)
    }
    return {data: data};
}

async function runEelEndpoint<T>(endpoint: EelPythonFunctions, params: any = {}): Promise<EelResponse<T>> {
    
    if (!eel) return {error: 'Eel Not initialized', errorTrace: []};
    var curExec = num++;
    debug && console.log(`[runEelEndpoint ${curExec}]: Contacting ${endpoint} with params:`, params);
    
    try {
        var k = await eel[endpoint](...params)();
        debug && console.log(`[runEelEndpoint ${curExec}]: Completed ${endpoint}, result:`, k);
        
    } catch (e) {
        debug && console.log(`[runEelEndpoint ${curExec}]: ERROR ${e.errorText}`);
        return parseEelError<T>(e)
    }
    return {data: k};
}
