import React, {useEffect, useState} from "react";
import './scss/Export.scss'
import ErrorHint from "../../../salma/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../salma/js/eel/eel";
import * as server from "./server"
import {ExportFolderContent} from "./server"
import {curTaskParameterValues} from "../../../salma/js/state/algstate";
import * as ui from "../../../salma/js/state/uistates";
import {Parameters} from "./params";

import {useRecoilState, useRecoilValue} from "recoil";
import {changeTaskParameterConfig} from "../../../salma/js/pipelines/pipeline";
import {OverlayState} from "../../../salma/js/types/uitypes";
import PreviewTable from "./PreviewTable";
import ToolTipIconButton from "../../../salma/js/ui/elements/ToolTipIconButton";
import {Description, FileCopy, Forest, InsertDriveFile, Park} from "@mui/icons-material";


interface IPredictionProps {
}


const Export: React.FC<IPredictionProps> = () => {
    
    const [wfdata, setWFData] = useState<ExportFolderContent>(null);
    const [overlay, setOverlay] = useRecoilState<OverlayState>(ui.overlay);
    const [error, setError] = useState<EelResponse<any>>(null)
    const curParams: Parameters = useRecoilValue(curTaskParameterValues) as Parameters;
    
    useEffect(() => {
        server.loadData().then((res:EelResponse<ExportFolderContent>)=>{
            console.log("Loaded",res)
            const spNames = {}
            for(let sp in res.data) spNames[res.data[sp].name] = res.data[sp].name + " (" + res.data[sp].exportableFiles.length + " files)"
            setWFData(res.data)
            changeTaskParameterConfig({"species": {input:{options: spNames}}})
        })
    }, []);
    
    // /**UI SPECIFIC STATE*/
    console.log("Export",wfdata,curParams.species)
    return (<div className={'salma-export'}>
        {error && <ErrorHint error={error}/>}
        {!curParams.species && <div className={'no-file-selected'}>Please select a species.</div>}
        {((curParams?.species && !curParams.singletable)||curParams.singletable) && wfdata &&
                <PreviewTable fileneames={wfdata}/>
        }
        <div className="button-bar fl-row-end pad-50-top">
        {curParams.singletable &&
                <ToolTipIconButton Icon={Forest} onClick={()=>server.runExport("all")} tooltipText={'Export the data for all species into a single CSV that will be located in the working folder.'} text={"Export all species"}/>
        }
        {!curParams.singletable && curParams.species &&
            <>
                <ToolTipIconButton Icon={Forest} className={"margin-50-right"} color={"secondary"} onClick={()=>server.runExport("individual")} tooltipText={'Export the data for all species into separate CSVs located in the respective species folders.'} text={"Export every species"}/>
                <ToolTipIconButton Icon={Park} color={"primary"} onClick={()=>server.runExport("single")} tooltipText={'Export the data for '+curParams.species+' into a CSV located in the species folder.'} text={"Export " + curParams.species}/>
            </>
        }
        </div>
    </div>);
}

export default Export;
