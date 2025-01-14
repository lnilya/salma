import React, {ReactNode, SVGProps, useEffect, useState} from "react";
import './scss/SalmaRefinement.scss'
import ErrorHint from "../../../salma/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../salma/js/eel/eel";
import * as server from "./server"
import {RefinementFolderContent, RefinementResult, SingleFileInfo} from "./server"
import {asWorkingFolderContent, curTaskParameterValues} from "../../../salma/js/state/algstate";
import * as ui from "../../../salma/js/state/uistates";
import {Parameters} from "./params";
import * as eventbus from "../../../salma/js/state/eventbus";

import {atom, atomFamily, useRecoilState, useRecoilValue} from "recoil";
import {Task} from "../../../salma/js/types/pipelinetypes";
import {ListSelectionEntry, TreeSelectionLeaf, TreeSelectionNode} from "../../../salma/js/modules/paramtypes";
import {changeTaskParameterConfig} from "../../../salma/js/pipelines/pipeline";
import {ParametersChangedPayload} from "../../../salma/js/state/eventbus";
import {useStepHook, useToggleKeys} from "../../../salma/js/modules/modulehooks";
import DisplayOptions, {DisplayOptionModKey, DisplayOptionSetting} from "../../../salma/js/ui/modules/DisplayOptions";
import {useLocalStoreRecoilHook} from "../../../salma/js/ui/uihooks";
import MasksOverImage, {MaskOverImageMask} from "../../../salma/js/ui/elements/MasksOverImage";
import ToolTipIconButton from "../../../salma/js/ui/elements/ToolTipIconButton";
import {Clear, DoneAll, Replay} from "@mui/icons-material";
import PolygonCloud, {AcceptedPolygon, RejectedPolygon} from "../../../salma/js/ui/elements/PolygonCloud";
import {overlay} from "../../../salma/js/state/uistates";
import {OverlayState} from "../../../salma/js/types/uitypes";
import {setTaskParameterValue} from "../../../salma/js/state/stateutil";
import * as eel from "../../../salma/js/eel/eel";
import * as self from "../SalmaTraining/params";

/**PERSISTENT UI STATE DEFINITIONS*/
// const asFlippedImage = atomFamily<PipelineImage,string>({key:'pre-processing_demo',default:null});
const asLastRunSettings = atomFamily< {params:Parameters},string>({key:'refinement',default:null});
const asImgTransparency = atom<number>({key:'refinement-imgtransp',default:0});

interface IPredictionProps {
}


const SalmaRefinement: React.FC<IPredictionProps> = () => {
    
    
    const updateSpeciesList = () => {
        if (!wfdata) return;
        const allFiles: SingleFileInfo[] = wfdata[curParams.species]
        const newFiles: ListSelectionEntry[] = allFiles.map((f) => {
            return {
                id: f.path,
                name: f.name,
                tooltip: !f.raw ? 'Segmentation is missing, please go to the previous step to create an initial segmentation using the model' : null,
                disabled: !f.raw,
                state: f.refined ? 'completed' : 'default'
            }
        })
        changeTaskParameterConfig({"file": {input:{options: newFiles}}})
    }
    
    const clearSelectedFile = () => {
        const fileSideBarParam = curTask.sidebarParameters.filter(p => p.key == 'file')[0]
        //set the file selector value to null
        setTaskParameterValue(fileSideBarParam, null)
    }
    
    const onSpeciesChange = (oldValue,newValue)=>{
        if (!newValue) return;
        updateSpeciesList()
        clearSelectedFile()
        setCurData(null)
    };
    const runMainAlgorithm = async (force:boolean = null)=>{
        
        const fileChanges = curParams?.file != lastRunSettings?.params?.file
        
        if(force === null)
            force = curData?.outdatedSettings !== true && !fileChanges
        
        if(!curParams.file ) return
        if(lastRunSettings?.params?.species != curParams.species && curParams.file == lastRunSettings?.params?.file) return
        if(!fileChanges && !force && curData?.outdatedSettings) return
        
        setCurData(null)
        setOverlay({msg:"Loading images...",display:"overlay",nonBlocking:false, progress:0,abortCallBack:()=>{eel.abortStep(curTask.name)}})
        const res = await server.runRefinement(force)
        setError(res)
        setOverlay(null)
        if(!res.error){
            //successfully ran the algorithm, update the UI
            console.log("Success", res.data)
            setCurData(res.data)
            setWFData(res.data.folderinfo)
        }else{
            setCurData(null)
        }
    }
    
    const [wfdata, setWFData] = useState<RefinementFolderContent>(null);
    const [overlay, setOverlay] = useRecoilState<OverlayState>(ui.overlay);
    const {curParams,curTask, lastRunSettings} = useStepHook<Parameters>(asLastRunSettings, {"species":onSpeciesChange}, runMainAlgorithm);
    
    useEffect(() => {
        server.loadData(setWFData)
        eventbus.listenTo("RefinementCompleted","sr",()=>{
            console.log("Refinement Completed")
            clearSelectedFile()
            setCurData(null)
            server.loadData(setWFData)
        })
        return ()=>eventbus.unlistenTo("sr")
    }, []);
    
    useEffect(() => {
        if (!wfdata) return;
        
        const spNames = {} //species:species
        for (let s of Object.keys(wfdata||{}))
            spNames[s] = s
        
        changeTaskParameterConfig({"species": {input:{options: spNames}}})
        if (curParams.species in spNames)
            updateSpeciesList()
    }, [wfdata]);
    
    const onFlipPolygon = async (idx:number) => {
        if(curData.outdatedSettings) return
        const newExcluded = [...curData.excludedContours]
        if(newExcluded.indexOf(idx) != -1) newExcluded.splice(newExcluded.indexOf(idx),1)
        else newExcluded.push(idx)
        await server.changePolygonChoice(newExcluded)
        setCurData({...curData,excludedContours:newExcluded})
    }
    
    // /**UI SPECIFIC STATE*/
    const [error, setError] = useState<EelResponse<any>>(null)
    const [curData, setCurData] = useState<RefinementResult>(null)
    const [transp,setTransp] = useLocalStoreRecoilHook(asImgTransparency,'pipeline');
    const mod = useToggleKeys(['1', '2','3'])
    const displayOptions:DisplayOptionSetting<any>[] = [
        {type:'slider',label:'Scan Transparency',sliderParams:[0,1,0.1], value:transp,setter:setTransp},
    ]
    
    const shownMasks:Array<MaskOverImageMask> = [
        { url:curData?.scannedImage.url, col:'original', opacity:mod["1"] ? 1 : transp },
        mod["2"] && { url:curData?.rawImage.url, col:'blue', opacity:1 }
    ];
    
    const pcf:(idx:number) => React.FC<SVGProps<SVGPolygonElement>> = (idx) => {
        if(curData.excludedContours.indexOf(idx) == -1) return AcceptedPolygon
        return RejectedPolygon
    }
    const toggleAll = async (select:boolean) => {
        if(select && curData?.excludedContours.length > 0){
            await server.changePolygonChoice([])
            setCurData({...curData,excludedContours:[]})
        }else  if(!select && curData?.excludedContours.length == 0){
            let allExcluded = curData.contours.map((c, i)=>i);
            await server.changePolygonChoice(allExcluded)
            setCurData({...curData,excludedContours:allExcluded})
        }
    }
    
    return (<div className={'salma-refinement'}>
        {error && <ErrorHint error={error}/>}
        {!curParams.file && <div className={'no-file-selected'}>Please select a species and a file to refine in the sidebar.</div>}
        {curData &&
            <>
                <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={mod}>
                    <div className="fl-grow"/>
                    {!curData.outdatedSettings &&
                        <div className="poly-info font-small fl-self-center fl-row fl-centered">Selected
                            Objects {curData.contours.length - curData.excludedContours.length}/{curData.contours.length}
                            <div className={"pad-25-hor"}>•</div>
                            {  curData?.excludedContours.length == 0 &&
                                <a href="#" onClick={()=>toggleAll(false)}>Unselect all</a>
                            }
                            { curData?.excludedContours.length > 0 &&
                                <a href="#" onClick={()=>toggleAll(true)}>Select all</a>
                            }
                        </div>
                    }
                </DisplayOptions>
                <div className="img-container">
                    {!mod['3'] &&
                        <PolygonCloud onClick={onFlipPolygon} PolyCompFactory={pcf} polygons={curData.contours} canvasDim={curData.refinedImage}/>
                    }
                    <MasksOverImage originalURL={curData.refinedImage.url} showOriginal={true} masks={shownMasks}/>
                </div>
                {curData.outdatedSettings &&
                    <div className={'outdated-settings fl-row-between'}>
                        <strong className={"pad-50-right font-small"}>
                            ⚠️ This result was generated using different settings and can't be changed. Hit the reset button (or delete the png file in the _predictions subfolder of this species) to regenerate it with the current settings.
                        </strong>
                        <div className="fl-self-center">
                            <ToolTipIconButton Icon={Replay} onClick={()=>runMainAlgorithm(true)} text={'Reset'} color={"primary"} tooltipText={"Will remove the result you see now and regenerate it with the current settings."}/>
                        </div>
                    </div>
                }
                    
            </>
        }
    </div>);
}

var modKeysDesc: DisplayOptionModKey[] = [
    {name: '1', desc: 'Hold "1" key to display the original image in full transparency.'},
    {name: '2', desc: 'Hold "2" key to display the initial segmentation in full transparency.'},
    {name: '3', desc: 'Hold "3" key to temporarily hide the leaf outline polygons.'},
]
export default SalmaRefinement
