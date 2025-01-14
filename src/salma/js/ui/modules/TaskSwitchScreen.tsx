import React from "react";
import {ccl} from "../../util";
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import {useRecoilValue} from "recoil";
import {TaskName} from "../../types/datatypes";
import WorkingFolderChoice from "../elements/WorkingFolderChoice";
import AnimateHeight from "react-animate-height";
import {loadTask} from "../../pipelines/pipeline";
import TaskListEntry from "./pipelineswitchscreen/TaskListEntry";

interface ITaskSwitchScreenProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * PipelineSwitchScreen
 * @author Ilya Shabanov
 */
const cl = ccl('pipeline-switch-screen--')
const TaskSwitchScreen:React.FC<ITaskSwitchScreenProps> = ({className}) => {
    
    const allTasks = useRecoilValue(ui.allTasks);
    const wf = useRecoilValue(alg.asWorkingFolderContent);
    
    const onLoadTask = (pl:TaskName)=>{
        loadTask(allTasks[pl]);
    }
    
	return (
        <div className={`task-switch-screen`}>
            <WorkingFolderChoice/>
            {/*Add MUI arrow down icon*/}
            <AnimateHeight height={wf?.species.length ? "auto" : 0} className={"full-w"}>
                <div className="full-w">
                    <h1 className="text-center header__title">SALMA</h1>
                    {Object.keys(allTasks).map((ok)=>
                        <TaskListEntry key={ok} tk={allTasks[ok]} onChoose={()=>onLoadTask(ok)}/>
                    )}
                </div>
            </AnimateHeight>
        </div>
	);
}
export default TaskSwitchScreen;