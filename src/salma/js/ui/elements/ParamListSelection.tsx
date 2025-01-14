import React from "react";
import {cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {FormControl, ListItemButton, NativeSelect, Tooltip} from "@mui/material";
import {IParamUISettingBase} from "../../types/uitypes";
import {
    DropDownParams,
    ListSelectionEntry,
    ListSelectionParams,
    TreeSelectionLeaf,
    TreeSelectionParams
} from "../../modules/paramtypes";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import {CheckCircle} from "@mui/icons-material";


interface IParamListSelectionProps extends IParamUISettingBase<ListSelectionParams> {
    curVal:string
}
/**
 * ParamDropdown
 * @author Ilya Shabanov
 */
const ParamListSelection:React.FC<IParamListSelectionProps> = ({onParameterChanged, tooltipPlacement, conf,curVal,disabled}) => {
    const handleChange = (newVal:string) => {
        onParameterChanged(conf,newVal);
    };
    
    const maxHeight = conf.input.numVisEntries * 31 + 25; //make the next element visible
    
	return (
        <div className={`param param-list-selection` + cl(disabled, 'is-disabled')}>
            <div className="fl-row-between">
                <div className="param__name">{conf.display.title}</div>
                <div className="fl-grow"/>
                <ParamHelpBtn toolTipPlacement={tooltipPlacement} content={conf.display.hint}/>
            </div>
    
            <div className="list-container" style={{maxHeight:maxHeight}}>
                <List>
                    {
                        conf.input.options.map((item:ListSelectionEntry) => {
                            var cn = "state-" + (item.state || "default")
                            if( curVal == item.id) cn += " selected"
                            var txt:any = item.name;
                            if (item?.state == "completed"){
                                txt = <>{item.name}<CheckCircle/></>
                            }
                            
                            var node = <ListItemButton selected={curVal==item.id} disabled={item.disabled} className={cn} onClick={e=>handleChange(item.id)}> {txt} </ListItemButton>
                            
                            if(item.tooltip){
                                node = <Tooltip title={item.tooltip} key={item.id} disableFocusListener disableHoverListener disableTouchListener
                                arrow placement={"right"}>{node}</Tooltip>
                            }
                            
                            return <ListItem key={item.id} disablePadding disableGutters>{node}</ListItem>
                        })
                    }
                </List>
            </div>
            
        </div>
	);
}
export default ParamListSelection;