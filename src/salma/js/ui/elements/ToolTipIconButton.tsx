import React, {ReactNode} from "react";
import '../../../scss/elements/ToolTipIconButton.scss'
import {Tooltip} from "@mui/material";
import {TooltipPlacement} from "../../types/uitypes";
import {SvgIconComponent} from "@mui/icons-material";

interface IToolTipIconButtonProps{
	
	/**Additional classnames for this component*/
	className?:string
    /**filled, outlined or no border*/
    appearance?:"fill"|"outline"|"transparent",
    color?:"primary"|"secondary",
    
    text?:ReactNode,
    
    /**React component to display*/
    Icon?:SvgIconComponent
    
    tooltipText?:ReactNode,
    tooltipDelay?:number,
    tooltipPlacement?:TooltipPlacement
    
    onClick?:(e?:any)=>void,
    disabled?:boolean
}
/**
 * Wraps a material UI icon with a tooltip
 * @author Ilya Shabanov
 */
const ToolTipIconButton:React.FC<IToolTipIconButtonProps> = ({text,appearance, disabled, tooltipPlacement, Icon,color,onClick,tooltipDelay,tooltipText,className}) => {
	tooltipPlacement = tooltipPlacement || 'top';
 
    color = color || 'primary';
    appearance = appearance || 'fill';
    
    className = className || '';
    if(disabled) className += ' disabled';
    className += ' '+appearance;
    className += ' '+color;
    
    var iconCol = '#4A5568';
    
	const btn = (
        <div className={'tool-tip-icon-button '+ className + (disabled ? "disabled" : "")} onClick={onClick}>
            {Icon && <Icon sx={color ? {color:iconCol} : {}}/>}
            {text && <span>{text}</span>}
        </div>
	);
    
    if (tooltipText)
        return (<Tooltip title={tooltipText} enterDelay={tooltipDelay} arrow placement={tooltipPlacement}>
            {btn}
        </Tooltip>)
    else
        return btn;
}
export default ToolTipIconButton;