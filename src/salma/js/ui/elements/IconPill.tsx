import React, {ReactNode} from "react"
import {Tooltip} from "@mui/material";

interface IIconPillProps {
    color:"error"|"success"|"info"|"warning"
    icon:ReactNode
    text:string
    tooltip?:string
};
const IconPill: React.FC<IIconPillProps> = ({color, icon, text, tooltip}) => {
    
    const btn = (<div className={`icon-pill col-${color}`}>
        {icon}
        <span>{text}</span>
    </div>);
    
     if (tooltip)
        return (<Tooltip title={tooltip} enterDelay={0} arrow placement={"top"}>
            {btn}
        </Tooltip>)
    else
        return btn;
}
export default IconPill;