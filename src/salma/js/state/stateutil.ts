import {getConnectedValue, updateConnectedValue} from "./ConnectedStore";
import {curTaskParameterValues} from "./algstate";
import {DType, Parameter, SettingDictionary} from "../modules/paramtypes";
import * as store from "./persistance";

const deepEqual = require('deep-equal')

/**
 * Will set the allParameterValues atom at the correct step with the parameter given.
 * Will also make sure the type is cast in the correct type.
 * Will make a deep comparison, to avoid unnecessary updates with same values.
 * @param conf
 * @param newVal
 */
export function setTaskParameterValue(conf:Parameter<any>, newVal:any){
    
    if(Array.isArray(newVal)) newVal = newVal.map((nv)=>parseValueToParamType(conf.dtype,nv));
    else newVal = parseValueToParamType(conf.dtype,newVal);
    
    //find the step this parameter is in
    var oldParams:SettingDictionary = getConnectedValue(curTaskParameterValues);
    //parameter value is the same, no need to do anything
    if(deepEqual(oldParams[conf.key],newVal)) {
        return;
    }
    
    var newP = {...oldParams, [conf.key]: newVal};
    
    store.saveParameters(newP);
    updateConnectedValue(curTaskParameterValues,newP);
}

//Cast according to desired type
export function parseValueToParamType(type:DType, newVal:any):any{
    if(type == DType.Bool) return !!newVal;
    else if(type == DType.String) return newVal === null ? null : ''+newVal;
    else if(type == DType.Int) return parseInt(newVal);
    else if(type == DType.Float) return parseFloat(newVal);
    
    return newVal;
}
