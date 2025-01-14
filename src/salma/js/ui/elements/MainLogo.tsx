import React from "react"
import {algorithmLogo, algorithmName} from "../../../../js/__config";

interface IMainLogoProps {
    className?: string,
    onClick:(e:any)=>void
};
const MainLogo: React.FC<IMainLogoProps> = ({className, onClick}) => {
    return (
        <div className={`main-logo ${className}`} onClick={onClick}>
            {algorithmLogo}
            <span>
                {algorithmName}
            </span>
        </div>
    );
}
export default MainLogo;