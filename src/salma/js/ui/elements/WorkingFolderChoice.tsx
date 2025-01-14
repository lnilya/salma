import React, {useEffect, useState} from "react"
import {Input} from "@mui/material";
import {useLocalStoreRecoilHook} from "../uihooks";
import {asWorkingFolder, asWorkingFolderContent} from "../../state/algstate";
import {LocalFile, LocalFolder} from "../../types/datatypes";
import * as server from "../../eel/eel";
import {useRecoilState} from "recoil";
import {useFavicon} from "react-use";
import ToolTipIconButton from "./ToolTipIconButton";
import TooltipHint from "./TooltipHint";
import ParamHelpBtn from "./ParamHelpBtn";

interface IWorkingFolderChoiceProps {

}

const WorkingFolderChoice: React.FC<IWorkingFolderChoiceProps> = () => {
   
    const [curFolder, setCurFolder] = useLocalStoreRecoilHook(asWorkingFolder, 'global');
    const [curFolderContent, setCurFolderContent] = useRecoilState(asWorkingFolderContent);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(null);
    
    
    //load folder contents on first display if none are loaded
    useEffect(() => {
        if (!curFolderContent && curFolder) fetchFolderContents(curFolder)
    }, [curFolder]);
    
    const fetchFolderContents = async (folder: string, selectFile: LocalFile = null) => {
        if (!folder) { //unselection
            setCurFolderContent(null)
            return;
        }
        // console.log(`[FilePicker]: Fetching: ${folder}`);
        setLoading(true)
        const res = await server.setWorkingFolder(folder)
        // console.log(res)
        setCurFolderContent(!res.error ? res.data : null)
        setLoading(false)
        if (res.error) setError(res.error)
        else setError(null)
    }
    
    //Folder TextField handling, fetch the folder when pressing enter, or loosing focus
    const onInputSubmit = (e) => fetchFolderContents(e?.target?.value)
    const onKeyUpInput = (e) => {
        if (e.keyCode == 13) e.target.blur();
    }
    
    var folderName = curFolderContent?.folder?.split('/').pop().split('\\').pop()
    
    //pass params to input field
    return (<div className="bg-bglight pad-100-excepttop working-folder-choice margin-100-bottom">
        <div className="fl-row">
            <h2 className="fl-grow">Working Folder</h2>
            <ParamHelpBtn toolTipPlacement={'top'} content={<>The working folder is a folder that will contain all the inputs and outputs. It needs to have a certain structure:
                <br/>
                <ul>
                    <li>It should contain folders. Each folder is interpreted as a species name and a separate model will be trained for the images in each folder.</li>
                    <li>Inside each folder are jpg/tif/png files containing the scans of the leafs.</li>
                    <li>As SALMA is used it will create new folders and files for masks, results and model files.</li>
                    <li>If you manually delete or modify any files in the working folder, reload the application.</li>
                </ul>
            </>}/>
        </div>
        
        <div className="fl-row">
            <strong className="margin-50-right fl-align-center">Absolute path:</strong>
            <Input className={'full-w'} placeholder={'Data Folder...'}
                   disabled={isLoading}
                   value={curFolder}
                   onChange={e => setCurFolder(e.target.value)}
                   onKeyUp={onKeyUpInput}
                   onBlur={onInputSubmit}/>
        </div>
        {!curFolderContent && curFolder.length > 0 && !isLoading &&
            <div className="fl-error text-right font-small col-error">
                ⚠ {error || 'No valid folder selected'}
            </div>
        }
        {isLoading &&
            <div className="fl-error text-right font-small col-help">
                Loading...
            </div>
        }
        {curFolderContent &&
            <>
                <div className="fl-error text-right font-small col-success">
                    ✓ Working folder "{folderName}" successfully loaded ({curFolderContent.species.length} species found).
                </div>
                <div className="margin-100-top hide ">
                    <div className="species-lest">
                        {curFolderContent.species.map((f, i) => {
                            const _maxDisplay = 10
                            if (i < _maxDisplay)
                                return <div key={i} className="species-list__item">{f} ({curFolderContent.numFiles[f]} files)</div>
                            else if(i == _maxDisplay)
                                return <div key={i} className="species-list__item">And {curFolderContent.species.length - _maxDisplay} others</div>
                            else
                                return null
                        })}
                    
                    </div>
                </div>
            </>
        }
    </div>);
}
export default WorkingFolderChoice;
