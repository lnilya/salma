import {Parameter, TreeSelectionParams} from "../../../salma/js/modules/paramtypes";
import {
    getCheckboxParams,
    getDropdownParams, getListSelectionParams,
    getSliderParams, getTextfieldInputParams,
    getTitleSeparatorParams, getTreeSelectionParams
} from "../../../salma/js/modules/paramutil";
import {connectedAtom} from "../../../salma/js/state/ConnectedStore";

/**Name of the module*/
export const taskName = 'Export'

/**Parameter UI Definition the user can set in PreProcessing*/
export const parameters:Array<Parameter<any>> = [
    getCheckboxParams('singletable','Single Table','If selected all species are exported to a single CSV table and a species column is added. The CSV file will be located in the working folder.',"One CSV file for all species",false),
    getDropdownParams('species','Species','Select the species you want to work on.',null,{},(params)=>params.singletable ? "hide" : "active",false),
    getCheckboxParams('exportsum','Sum','If an image contains multiple leafs/fragments you can check this option to only export the sum of the image and not the single objects found in it. If you only have one leaf per image this option makes no difference.',"Export one entry per image",false),
    // getCheckboxParams('idsheet','ID Sheet','If set this generates an image where every object in the scan has a number drawn on it. The same number is used in the object id column of the exported CSV. This way you can match the single scanned area to the csv row.',"Generate ID Sheets",false,(params)=>params.exportsum ? "hide" : "active"),
    getTextfieldInputParams('splitter','Split File Name','Without a splitter the file name will be single columnt in the resulting table. However, it often contains information split by a character e.g. "control_1_27122024.jpg". By setting a splitter character to "_" the file name will be split into 3 columns instead containing "control", "1" and "27122024", which might be interpreted as your control experiment number 1 on the 27th of december 2024. Leave blank if you don\'t want to split the file name.',"Split Characters...",""),
    getTextfieldInputParams('dpi','DPI Scale','DPI stands for dots per inch and is the most typical way of quantifying the resolution of your scans. At a DPI of 600 every inch (2.54cm) equals 600px. If this value is set all values will be converted to mm² otherwise they will be provided in pixel. If you are using photographs of varying scale it you should first scale all photographs to the same scale and then use Salma, as some Salma models might be scale sensitive. Leave blank or set to 0 to ignore.',"DPI...","0",null,false,"number"),
];

/**Parameter Object of PreProcessing - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    singletable:boolean,
    species:string,
    exportsum:boolean,
    // idsheet:boolean,
    splitter:string,
    dpi:number,
}