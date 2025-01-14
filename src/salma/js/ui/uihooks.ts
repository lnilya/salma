import {atomFamily, RecoilState, useRecoilState, useRecoilValue} from "recoil";
import {useEffect} from "react";
import * as alg from '../state/algstate'
import * as ui from '../state/uistates'
import * as storage from '../state/persistance'
import {TaskName} from "../types/datatypes";

const asPrevSettings = atomFamily<boolean,string>({key:'prev_settings',default:false});
export function useInitalLoadCallback(recoilState:RecoilState<any>, initCallBack:()=>any){
    const [initialized, setInitialized] = useRecoilState(asPrevSettings(recoilState.key));
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    
    useEffect(()=>{
        if(!initialized) initCallBack()
        setInitialized(true)
    },[])
    
}

export function useLocalStoreRecoilHook(recoilState:RecoilState<any>,scope:'global'|'pipeline' = 'pipeline', initalLoad:boolean = true, pipelineName:TaskName = null){
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    if(scope == 'pipeline' && pipelineName == null)
        pipelineName = useRecoilValue(ui.selectedPipelineName);
    
    
    //load data on init if necessary
    useEffect(()=>{
        if(!initalLoad) return;
        var data = curSettings;
        if(scope == 'global') data = storage.loadGlobalData(recoilState.key);
        else if(scope == 'pipeline') data = storage.loadDataForPipeline(recoilState.key,pipelineName);
        if(data !== null) setCurSettings(data);
        console.log('Loaded data for',recoilState.key,data)
    },[])
    
    //store data on write
    const writeOut = (data)=>{
        setCurSettings(data)
        if(scope == 'global') storage.saveGlobalData(data,recoilState.key);
        else if(scope == 'pipeline') storage.saveDataForPipeline(data,recoilState.key,pipelineName);
    }
    
    return [curSettings,writeOut]
}