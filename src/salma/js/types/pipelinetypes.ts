import * as datatypes from "./datatypes";
import {TaskName} from "./datatypes";
import {ReactNode} from "react";
import {ModuleID} from "./uitypes";
import {Parameter} from "../modules/paramtypes";


/**Describes total settings for a single Pipeline*/
export type Task = {
    /**A unique name for the Pipeline used in the UI, should be short to appear for example in dropdowns.*/
    name: TaskName
    
    /**UI Component responsible for rendering*/
    renderer:ReactNode,
    
    /**Icon used in the menu*/
    menuIcon:ReactNode,
    
    /**Sidebar parameters*/
    sidebarParameters:Array<Parameter<any>>,
    
    /**Sidebar additional elements (e.g. buttons)*/
    sidebarElements?:ReactNode,
    
    /**Help String */
    descriptions?:{
        /**The possibly longer title of this pipeline*/
        title?:ReactNode
        /**Long Description of what this pipeline is doing in a paragraph or two.*/
        description?:ReactNode
        /**Thumbnail for this Pipeline*/
        thumb?:ReactNode
        /**Helpscreen Component*/
        helpscreen?:ReactNode
    },
    
}
