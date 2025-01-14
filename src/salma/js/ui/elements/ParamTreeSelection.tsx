import React from "react";
import {cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {FormControl, NativeSelect, Tooltip} from "@mui/material";
import {IParamUISettingBase} from "../../types/uitypes";
import {DropDownParams, TreeSelectionLeaf, TreeSelectionParams} from "../../modules/paramtypes";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

interface IParamTreeSelectionProps extends IParamUISettingBase<TreeSelectionParams> {
    curVal:string
}
/**
 * ParamDropdown
 * @author Ilya Shabanov
 */
const ParamTreeSelection:React.FC<IParamTreeSelectionProps> = ({onParameterChanged, tooltipPlacement, conf,curVal,disabled}) => {
    const handleChange = (event) => {
        onParameterChanged(conf,event.target.value);
    };
    
    
    console.log("ParamTreeSelection", conf);
    
    const renderBranch = (branch:Record<string,any>, runningID:string = "") => {
        if (branch === null) return [];
        return Object.entries(branch).map((entry: [string, Record<string, any>]) => {
            
            const isLeaf = entry[1].hasOwnProperty("tooltip") || entry[1].hasOwnProperty("state") || entry[1].hasOwnProperty("disabled");
            const id = runningID +"____"+ entry[0];
            if (isLeaf) {
                const leaf = entry[1] as TreeSelectionLeaf;
                const node = <TreeItem key={id} label={entry[0]} itemId={id} disabled={leaf?.disabled} className={"item-state-"+(leaf?.state||"default")}/>
                if(leaf.tooltip){
                    return <Tooltip title={leaf.tooltip} key={runningID} disableFocusListener disableHoverListener disableTouchListener
                    arrow placement={"right"}>{node}</Tooltip>
                }
                return node
            }
            return (
                <TreeItem key={id} itemId={id} label={entry[0]}
                          children={typeof entry[1] === 'object' ? renderBranch(entry[1], id) : []}/>
            )
        })
    }
    
	return (
        <div className={`param param-dropdown` + cl(disabled, 'is-disabled')}>
            <div className="fl-row-between">
                <div className="param__name">{conf.display.title}</div>
                <div className="fl-grow"/>
                <ParamHelpBtn toolTipPlacement={tooltipPlacement} content={conf.display.hint}/>
            </div>
    
            <div className="">
                <SimpleTreeView>
                    {renderBranch(conf.input.options)}
                </SimpleTreeView>
            </div>
            
        </div>
	);
}
export default ParamTreeSelection;