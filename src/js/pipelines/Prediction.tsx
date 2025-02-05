import React from "react";
import {Task} from "../../salma/js/types/pipelinetypes";
import ResponsiveEmbed from 'react-responsive-embed'
import * as SalmaTrainingParams from '../modules/SalmaTraining/params'
import * as SalmaPredictionParams from '../modules/SalmaPrediction/params'
import * as ExportParams from '../modules/Export/params'
import SalmaTraining from "../modules/SalmaTraining/SalmaTraining";
import thumbPr from '../../assets/images/Prediction.jpg'
import thumbTr from '../../assets/images/Training.jpg'
import thumbEx from '../../assets/images/ExportStep.jpg'
import {CheckCircle, Description, ElectricBolt, Spa} from "@mui/icons-material";
import SalmaRefinement from "../modules/SalmaPrediction/SalmaRefinement";
import RefinementSidebarButtons from "../modules/SalmaPrediction/RefinementSidebarButtons";
import Export from "../modules/Export/Export";
//%NEWMODULE_IMPORT%

const inputKeys = {
    rawImage: 'Raw Image',
}
const dataKeys = {
    processedImage: 'Processed Image', //example, some step for example adds these two images into one.
    borderedImage: 'Bordered Image', //example, some step for example adds these two images into one.
}

const helpScreen = <div>
    These tutorials will be added in the final version of SALMA after peer review to maintain anonymity.
    
    Please refer to the video provided along with the peer review documents for a walk through of the software.
    {/*This step is a simple step that show you how to train a model and make predictions.*/}
    {/*<br/>*/}
    {/*<ResponsiveEmbed src='https://www.youtube.com/embed/QtzI1SwOdbY' allowFullScreen/>*/}
</div>

function getAllTasks(): Task[] {
    
    return [
        {
            name: SalmaTrainingParams.taskName, //name of your pipeline
            renderer: <SalmaTraining/>,
            menuIcon: <ElectricBolt/>,
            sidebarParameters: SalmaTrainingParams.parameters,
            
            //Info for user
            descriptions: {
                title: 'Training and Initial Segementation',
                description: 'Trains SALMA models, sets up the folder structure and runs inital image segmentations, that can be refined before export.',
                helpscreen: helpScreen,
                thumb: <img src={thumbTr} alt={'Thumb'}/>
            }
        },
        {
            name: SalmaPredictionParams.taskName, //name of your pipeline
            renderer: <SalmaRefinement/>,
            menuIcon: <CheckCircle/>,
            sidebarParameters: SalmaPredictionParams.parameters,
            sidebarElements: <RefinementSidebarButtons/>,
            
            //Info for user
            descriptions: {
                title: 'Refinement and Selection',
                description: 'Manually refine the predictions by excluding erroenous segmentations (e.g. shadows), close holes and smoothen outlines. Results are exported to a separate image file that will be used in the next step to export to CSV.',
                helpscreen: helpScreen,
                thumb: <img src={thumbPr} alt={'Thumb'}/>
            }
        },
        {
            name: ExportParams.taskName, //name of your pipeline
            renderer: <Export/>,
            menuIcon: <Description/>,
            sidebarParameters: ExportParams.parameters,
            sidebarElements: null,
            
            //Info for user
            descriptions: {
                title: 'Measure and Export',
                description: 'Measure various morphological properties from the resulting leaf segmentations (e.g. area, eccentricity or width). Then define an export format and export the results to a CSV file.',
                helpscreen: helpScreen,
                thumb: <img src={thumbEx} alt={'Thumb'}/>
            }
        }
        
    ]
}

export default getAllTasks;