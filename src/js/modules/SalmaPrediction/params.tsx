import {Parameter, TreeSelectionParams} from "../../../salma/js/modules/paramtypes";
import {
    getCheckboxParams,
    getDropdownParams, getListSelectionParams,
    getSliderParams,
    getTitleSeparatorParams, getTreeSelectionParams
} from "../../../salma/js/modules/paramutil";
import {connectedAtom} from "../../../salma/js/state/ConnectedStore";

/**Name of the module*/
export const taskName = 'Refinement'

const openingDesc = <>This smoothens the outlines of the binary masks and closes small holes by using a morpholigcal <a href={"https://en.wikipedia.org/wiki/Opening_(morphology)"}>Opening</a> with a disc. The size of the disc is defined by this parameter. The opening operation produces more organic outlines, but may move the boundaries. Experiment with this setting as an alternative to the closing holes setting.<br/>⚠️A high value can make the refinement slow.</>

/**Parameter UI Definition the user can set in PreProcessing*/
export const parameters:Array<Parameter<any>> = [
    getTitleSeparatorParams('selection','Image Selection','Select the image and species you want to work on. Once you have found good parameters for the entire set, you can also batch run the refinement for all images of a species.'),
    getDropdownParams('species','Species','Select the species you want to work on.',null,{},null,false),
    getListSelectionParams('file','Filename','Pick the file to refine. If the file name is greyed out, the initial segmentation is missing. In that case, go back to the previous step and rerun the initial segmentation for this species.',null,[],null,false,6),
    getTitleSeparatorParams('segment','Filtering','These parameters allow you to automatically filter out too small or too large specks, close holes and so on. After this is done you can manually click on the canvas to exclude leaf outlines that were erroneously captured.'),
    getCheckboxParams('keeponlybiggest','One leaf per Scan','If checked, only the biggest object in the image will be kept. Activate this option if you have exactly one leaf per scan.',"Keep only biggest object",false),
    getSliderParams("minsize","Min. Element Size (in px)","The minimum size in pixels for valid elements (i.e. leaves) you want to keep. Every element smaller than this will be discarded. Operation is applied after smoothing and closing holes.",10,1000,10,50, true,(params)=>params.keeponlybiggest ? "hide" : "active"),
    getSliderParams("openingsize","Smoothen shapes",openingDesc,0,100,1,0, false),
    getSliderParams("maxholesize","Closing Holes (in %)","If >0 this will close holes inside blobs that are above this size. If, for example, you know that your scanned leaves are healthy and should not contain holes, this value can be set to a large value. The value is set in % of the leaf area. Operation is applied after the smoothing.",0,100,0.1,10, false),
    
];

/**Parameter Object of PreProcessing - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    species:string,
    file:string,
    keeponlybiggest:boolean,
    minsize:number,
    openingsize:number,
    maxholesize:number
    
}