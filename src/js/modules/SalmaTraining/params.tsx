import {Parameter} from "../../../salma/js/modules/paramtypes";
import {
    getCheckboxParams,
    getDropdownParams,
    getSliderParams,
    getTitleSeparatorParams
} from "../../../salma/js/modules/paramutil";

/**Name of the module*/
export const taskName = 'Training And Segmentation'

/**Parameter UI Definition the user can set in PreProcessing*/
export const parameters:Array<Parameter<any>> = [
    getTitleSeparatorParams('preprocessing','Model Training','Parameters related to the training of the models. These parameters will be used when you click the train button.'),
    getSliderParams('subsampling','Subsampling','Selects the number of pixels used from each training image. The more pixels are used the longer the training will take. More than 1000-2000 pixels are likely not necessary. Try to increase this parameter if model performance is poor.',100,5000,100,1000,false),
    getTitleSeparatorParams('mpsection','Segmentation','Parameters related to using the trained model for initial segmentation.'),
    getSliderParams('numcpus','Parallel processes','Set the number of parallel processes to run for prediction. The optimal number is approximately the number of CPUs on your machine. Set to 1 if prediction crashes to generate more detailed debugging output.',1,64,1,8,false),
];

/**Parameter Object of PreProcessing - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    threshold:number
}