import os
import threading
import traceback
from typing import Dict

import eel

from src.py.__config import getModuleConnector
from src.salma.py.ModuleConnector import ModuleConnector
from src.salma.py.SessionData import SessionData
from src.salma.py.modules.ModuleBase import ModuleBase

executionKey:int = 0
log = True

class EelSession:
    #Stores module instances by their ID
    _modulesById: Dict[str, ModuleBase] = {}

    #Stores module instances by their Thread Execution key, allows to kill if necessary
    _modulesByExecutionKey: Dict[str, ModuleBase] = {}

    #Sessiondata stores all the information produced by Modules
    _session: SessionData

    #Module Connector initializes modules, aggregators, loaders
    _moduleConnector:ModuleConnector

    #Stores parameters passed to newly initialized modules/steps in the pipeline
    _pipelineParams: Dict = {}

    _instance:"EelSession" = None

    def __init__(self):
        print("_init_ EELESESSION")
        self._modulesById = {}
        self._modulesByExecutionKey = {}
        self._session = SessionData()
        self._moduleConnector = getModuleConnector()
        self._pipelineParams = {}

    @classmethod
    def reset(cls):
        cls._instance = EelSession()

    #class property for singleton modiules by ID
    @classmethod
    def modulesById(cls)->Dict[str, ModuleBase]:
        if cls._instance is None: cls._instance = EelSession()
        return cls._instance._modulesById

    #class property for singleton modiules by Execution Key
    @classmethod
    def modulesByExecutionKey(cls)->Dict[str, ModuleBase]:
        if cls._instance is None: cls._instance = EelSession()
        return cls._instance._modulesByExecutionKey

    #class property for singleton session
    @classmethod
    def session(cls)->SessionData:
        if cls._instance is None: cls._instance = EelSession()
        return cls._instance._session

    #class property for singleton module connector
    @classmethod
    def moduleConnector(cls)->ModuleConnector:
        if cls._instance is None: cls._instance = EelSession()
        return cls._instance._moduleConnector

    #class property for singleton pipeline parameters
    @classmethod
    def pipelineParams(cls)->Dict:
        if cls._instance is None: cls._instance = EelSession()
        return cls._instance._pipelineParams




def getTaskModule(taskName: str):
    if taskName not in EelSession.modulesById():
        EelSession.modulesById()[taskName] = EelSession.moduleConnector().initializeModule(taskName, EelSession.session())

    return EelSession.modulesById()[taskName]

def startThreadInModule(m:ModuleBase, asyncKey:int, params):
    print("[Eel]: Started Run in separate thread with execKey %s"%(asyncKey))
    m.startingRun()  # indicate that we started, important to be able to abort
    try:
        res = m.run(*params)
    except Exception as e:
        traceback.print_exc()
        print("[Eel]: Error or Abort in Thread %s"%(asyncKey))
        eel.asyncError(asyncKey, {'errorText':str(e)})
    else:
        print("[Eel]: Ending Thread %s"%(asyncKey))
        eel.asyncFinished(asyncKey,res)


@eel.expose
def setWorkingFolder(folder:str):

    exists = os.path.exists(folder)
    if exists:
        #get all directories in the folder and put their names into a folder
        folders = [f for f in os.listdir(folder) if os.path.isdir(os.path.join(folder,f))]
    else:
        raise FileNotFoundError('Folder %s does not exist'%folder)
    #go through each folder and check how many files are inside each
    numFiles = {}
    for f in folders:
        numFiles[f] = len([name for name in os.listdir(os.path.join(folder,f)) if os.path.isfile(os.path.join(folder,f,name))])

    #create a detailed object with all file names stored as dictionaries. Essentially a tree structure
    details = {}
    for f in folders:
        details[f] = {
            "input":{},
            "predictions":{},
            "rawPredictions":{},
        }


    return {"folder":folder, "species":folders, "numFiles":numFiles}

@eel.expose
def onNewPipelineLoaded(pipelineID:str, pipelineParamsByModuleID:Dict = None):

    #simply delete all data related to the old modules
    EelSession.reset()
    print('[EEL] New Pipeline loaded %s'%pipelineID)
    return True

# Central function for running a step with its respective parameters
# Parameters are defined in the JS definition of module. Module will be instantiated if it has not been created yet.
@eel.expose
def runStep(taskName: str, action:str, params: Dict[str, str]):

    m: ModuleBase = getTaskModule(taskName)
    if log:
        print('[Eel PID(%s)]: Running action: %s on %s with inputs.' % (os.getpid(), action, taskName))

    res = m.run(action, params)

    if log:
        print('[Eel PID(%s)]: Completed action: %s' % (os.getpid(), action))
    return res



# Async version of runStep.
# Will get a key that is used as an identifier for the thread.
# JS can send a termination signal with that key to stop the execution and it will get a callback with that key when execution is completed.
@eel.expose
def runStepAsync(threadID, taskName: str, action:str, params: Dict[str, str]):
    m: ModuleBase = getTaskModule(taskName)
    if log:
        print('[Eel]: Running async action: %s on %s with inputs.' % (action, taskName))

    #start execution in a separate thread
    EelSession.modulesByExecutionKey()[threadID] = m
    tmp = threading.Thread(target=startThreadInModule, args = (m,threadID,[action, params]) )
    tmp.start()
    # eel.spawn(startThreadInModule, m, threadID, [action, params])


@eel.expose
def abortStep(execKey:str):
    if execKey in EelSession.modulesByExecutionKey():
        m = EelSession.modulesByExecutionKey()[execKey]
        m.abort()
        print("[Eel]: Sent Abort signal to module %s in thread %s"%(m.id,execKey))
    else:
        print("[Eel]: Ignoring abort signal for thread %s, since it can't be found."%(execKey))


