import {Button, Dialog} from "@mui/material";
import React, {useState} from "react"
import {Task} from "../../../types/pipelinetypes";

interface ITaskListEntryProps{
    tk:Task,
    onChoose:()=>void,
}
const TaskListEntry:React.FC<ITaskListEntryProps> = ({tk, onChoose}) => {
	
    const [showingHelp,setShowingHelp] = useState(false);
    
	return (<div className={'task-list-entry margin-200-bottom full-w'}>
        <div className="fl-row bg-bglight">
            {tk.descriptions?.thumb &&
                <div className="task-list-entry__thumb">
                    {tk.descriptions?.thumb}
                </div>
            }
            <div className={'task-list-entry__text pad-100 fl-grow'}>
                <h2>{tk.descriptions?.title || tk.name}</h2>
                <div className="task-list-entry__desc">
                    {tk.descriptions?.description}
                </div>
            </div>
        </div>
        <div className="margin-50-top text-right fl-row-end">
            {tk?.descriptions?.helpscreen &&
                <>
                    <Dialog open={showingHelp} onClose={e=>setShowingHelp(false)} maxWidth={'md'} fullWidth={true}>
                        <div className="pad-200 pad-100-top">
                            <h1 className={'margin-0-top'}>Tutorial {tk.descriptions.title}</h1>
                            {tk.descriptions.helpscreen}
                        </div>
                    </Dialog>
                    <Button variant={"outlined"} color={'secondary'} onClick={e=>setShowingHelp(true)}>Show Tutorial</Button>
                    <div className="margin-100-right"/>
                </>
            }
            
            <Button variant={"contained"} color={'primary'} onClick={onChoose}>Start {tk.name}</Button>
        </div>
        
	</div>);
}
export default TaskListEntry;