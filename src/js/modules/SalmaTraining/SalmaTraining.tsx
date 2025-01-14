import React, {useEffect, useState} from "react";
import './scss/SalmaTraining.scss'
import ErrorHint from "../../../salma/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../salma/js/eel/eel";
import * as server from "./server"
import {Parameters} from "./params";

import {useRecoilValue} from "recoil";
import {curTaskParameterValues} from "../../../salma/js/state/algstate";
import {DataGrid, GridApi, GridColDef, GridEditCellValueParams} from "@mui/x-data-grid";
import {Box, Button} from "@mui/material";
import ToolTipIconButton from "../../../salma/js/ui/elements/ToolTipIconButton";
import {
    AccessAlarmTwoTone,
    AutoAwesome,
    CheckCircle,
    Contrast,
    ElectricBolt,
    PhotoLibrary,
    Replay
} from "@mui/icons-material";
import ButtonIcon from "../../../salma/js/ui/elements/ButtonIcon";
import IconPill from "../../../salma/js/ui/elements/IconPill";

interface IPreProcessingProps {
}

const SalmaTraining: React.FC<IPreProcessingProps> = () => {
    
    const [wfdata, setWFData] = useState(null);
    const curParams: Parameters = useRecoilValue(curTaskParameterValues) as Parameters;
    
    useEffect(() => {
        server.initFolder(setWFData)
    }, []);
    
    const predict = async (species:string[]) => {
        if(!species) species = wfdata.info.map(d => d.id)
        const wf = await server.runPredictions(species)
        if(wf.error) setError(wf)
        else setWFData(wf.data)
    }
    const train = async (species:string[]) => {
        if(!species) species = wfdata.info.map(d => d.id)
        const wf = await server.runTraining(species)
        if(wf.error) setError(wf)
        else setWFData(wf.data)
    }
    
    // /**UI SPECIFIC STATE*/
    const [error, setError] = useState<EelResponse<any>>(null)
    
    const columns: GridColDef[] = [
        {
            field: 'id', headerName: 'Species',
            flex: 1,
            headerAlign: 'left', align: 'left',
            
            valueGetter: (value, row) => `${row["id"]} (${row.Images})`,
            renderCell: (params) => {
                let timg = params.row["Training Images"]
                let predImg = params.row["Raw Predictions"]
                let refinedImg = params.row["Refined Predictions"]
                let totalImg = params.row.Images
                
                let trToolTip = "Number of images provided for training the model. "
                let predImgToolTip = "Number of images segmented with the model. "
                let refinedImgToolTip = "Number of images screened for export. "
                
                if(predImg != totalImg && predImg > 0)
                    predImgToolTip += "These do not match the number of images in the folder. Rerun the segmentation to make sure all images are processed."
                else if(predImg == 0)
                    predImgToolTip += "Run the segmentation to create segmentations."
                else
                    predImgToolTip += "All images have been processed."
                
                if(refinedImg != totalImg && refinedImg > 0)
                    refinedImgToolTip += "These do not match the number of images in the folder. Rerun the segmentation to make sure all images are processed."
                else if(refinedImg == 0)
                    refinedImgToolTip += "Run screening from the left sidebar menu to start."
                else
                    refinedImgToolTip += "All images have been screened."
                
                if (timg == 0) trToolTip = "No images provided for training. Please manually provide images for training."
                else if (timg > 0 && params.row.Mtime == -1) trToolTip += " Model has not yet been trained. Click the training button to start."
                else if (timg != params.row["MNumImgs"] && params.row.Mtime != -1) trToolTip += " Model has been trained on "+ params.row["MNumImgs"] + " images, which does not match the "+timg+" provided. Retrain the model to use the current selection of training images."
                else if (timg > 0 && params.row.Mtime != -1) trToolTip += " Model has been trained on "+ params.row["Mtime"] + ". Ready for segmentation."
                
                else trToolTip += "All images have been provided for training."
                
                return <div className={"table-cell fl-col full-h"}>
                    <div>
                        <strong>
                            {params.row.id}
                        </strong>
                        <div className="fl-row margin-25-top">
                            <IconPill color={"info"} icon={<PhotoLibrary/>} text={totalImg} tooltip={"Number of images in the folder for this species."} />
                            <IconPill color={timg == 0 ? "error" : (params.row.Mtime == -1 || (timg != params.row["MNumImgs"] && params.row.Mtime != -1) ) ? "warning" : "success"} icon={<ElectricBolt/>} text={timg} tooltip={trToolTip} />
                            <IconPill color={predImg == 0 ? "info" : (predImg == totalImg ? "success" : "error")} icon={<Contrast/>} text={predImg} tooltip={predImgToolTip} />
                            <IconPill color={refinedImg == 0 ? "info" : (refinedImg == totalImg ? "success" : "error")} icon={<CheckCircle/>} text={refinedImg} tooltip={refinedImgToolTip} />
                            
                        </div>
                    </div>
                </div>
            }
        },

        {
            field: 'Mtime',
            headerName: 'Tr. Date',
            minWidth: 200,
            headerAlign: 'center', align: 'center',
            valueGetter: (value, row) => value == -1 ? "-" : value,
            disableColumnMenu: true,
        },
        {
            field: 'MScore',
            headerName: 'Tr. Accuracy',
            type: 'number',
            headerAlign: 'center', align: 'center',
            minWidth: 150,
            valueGetter: (value, row) => value == -1 ? "" : `${value*100}%`,
            disableColumnMenu: true,
        },
        {
            field: "action",
            headerName: "Actions",
            disableColumnMenu: true,
            sortable: false,
            headerAlign: 'center', align: 'center',
            minWidth: 120,
            renderCell: (params) => {
                const onTrain = (e) => {
                    e.stopPropagation(); // don't select this row after clicking
                    train([params.row.id])
                };
                const onPredict = (e) => {
                    e.stopPropagation(); // don't select this row after clicking
                    predict([params.row.id])
                };
                console.log(params.row)
                return <div className={"fl-row fl-align-center full-h"}>
                     <ToolTipIconButton className={"margin-50-right"} disabled={params.row["Training Images"] <= 0} tooltipText={"Train model for " + params.row.id} appearance={"outline"} color={"secondary"} Icon={ElectricBolt} onClick={onTrain}/>
                     <ToolTipIconButton tooltipText={"Segment "+params.row.Images+" images for " + params.row.id} disabled={params.row.Mtime == -1} appearance={"outline"} color={"secondary"} Icon={Contrast} onClick={onPredict}/>
                </div>
    
                // return <ToolTipIconButton Icon={Replay}  color={"main"} tooltipText={"Retrain Model"} onClick={onClick} disabled={!active}/>
            }
        }
    ];
    
    const numSpeciesWithModels = wfdata ? wfdata.info.filter(d => d.Mtime != -1).length : 0;
    
    const predLabel = numSpeciesWithModels == wfdata?.info.length ? "Segment all images" : `Segment images for ${numSpeciesWithModels}/${wfdata?.info.length} species`
    
    return (<div className={'salma-training pad-100-top'}>
        {error && <ErrorHint error={error}/>}
        {wfdata &&
            <>
                {/*<h4>Working Folder Contents</h4>*/}
                <DataGrid
                    rows={wfdata.info}
                    columns={columns}
                    getRowHeight={() => 70}
                    // initialState={}
                    disableRowSelectionOnClick
                    disableColumnSelector
                />
                <div className="margin-50-top fl-row-between">
                    <ToolTipIconButton color={"secondary"} text={"Reload Contents"}
                                       onClick={() => server.initFolder(setWFData)} Icon={Replay}/>
                    <div className="fl-grow"></div>
                    <ToolTipIconButton color={"primary"} text={"Train all models"} onClick={e=>train(null)} Icon={ElectricBolt}/>
                    <ToolTipIconButton disabled={numSpeciesWithModels == 0} color={"primary"} className={"margin-50-left"} text={predLabel} onClick={e=>predict(null)} Icon={Contrast} tooltipText={"Runs the image segmentation for all species, where a model is present. This creates preliminary segmentations into leaf and background and stores them as pdfs in the _rawPredictions folder."}/>

                </div>
            </>
        }
    </div>);
}
export default SalmaTraining
