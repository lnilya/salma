import React from "react"
import * as self from "./params";
import * as ui from "../../../salma/js/state/uistates";
import * as alg from "../../../salma/js/state/algstate";
import {useRecoilValue} from "recoil";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import IconPill from "../../../salma/js/ui/elements/IconPill";
import {CheckCircle, Contrast, ElectricBolt, PhotoLibrary} from "@mui/icons-material";
import ToolTipIconButton from "../../../salma/js/ui/elements/ToolTipIconButton";
import {Tooltip} from "@mui/material";
import {ExportFolderContent, ExportResult} from "./server";

interface IPreviewTableProps {
    fileneames: ExportFolderContent
}
const PreviewTable: React.FC<IPreviewTableProps> = ({fileneames}) => {
    
    const curParams:self.Parameters = useRecoilValue(alg.curTaskParameterValues) as self.Parameters;
    
    let columns: GridColDef[] = [
        {field: 'filename', headerName: 'File'}
    ];
    
    if(curParams.singletable)
        columns.push({field: "species", headerName: "Species"})
    
    if(curParams.splitter){
        const numCols = fileneames[Object.keys(fileneames)[0]].exportableFiles[0].split(curParams.splitter).length
        for (let i = 0; i < numCols; i++){
            columns.push({ field: "col_"+i, headerName: "Descriptor "+i })
        }
    }
    if(!curParams.exportsum){
        columns.push({field:"el", headerName:"Element"})
    }
    columns.push({field: "area", headerName: (curParams.exportsum ? "Total " : "") +  (curParams.dpi > 0?"Area in sqmm":"Area in px")})
    columns.push({field: "other", headerName: "Other Measurements"})
    
    columns.map(c => c.flex = 1)
    columns.map(c => c.sortable = false)
    columns.map(c => c.disableColumnMenu = true)
    
    
    const demoData = []
    let species = curParams.singletable ? Object.keys(fileneames) : [curParams.species]
    //shuffle species
    species = species.sort(() => Math.random() - 0.5)
    if(species.length > 2)
        species = species.slice(0,2)
    
    for(let sp of species) {
        fileneames[sp]?.exportableFiles.map((f, i) => {
            if (i > 2) return
            if (i == 2) {
                let obj = {
                    "filename": "...",
                }
                if (curParams.singletable)
                    obj["species"] = "..."
                demoData.push(obj)
                return
            } //only take the first few entries
            let obj = {
                "filename": f,
                "other": "...",
                "area": curParams.dpi > 0 ? 4567.8 : 1234,
            }
            if (curParams.singletable)
                    obj["species"] = sp
            if (curParams.splitter) {
                f.split(curParams.splitter).map((s, i) => {
                    obj["col_" + i] = s
                })
            }
            
            if (!curParams.exportsum) {
                ["1", "2", "..."].map((s, i) => {
                    const newObj = {...obj}
                    newObj["el"] = s
                    demoData.push(newObj)
                })
            } else {
                demoData.push(obj)
            }
        })
    }
        
    demoData.map((d,i) => d.id = i)
    
    return (<div className={"preview-table"}>
        <h2>Preview Table</h2>
        <DataGrid
                    rows={demoData}
                    columns={columns}
                    getRowHeight={() => 40}
                    disableRowSelectionOnClick
                    hideFooter
                    disableColumnSelector
                    disableColumnSorting
                    disableColumnMenu
                    disableMultipleRowSelection
                />
    </div>);
}
export default PreviewTable;