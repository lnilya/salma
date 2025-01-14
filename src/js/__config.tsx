import {createTheme} from "@mui/material";
import packageJson from "../../package.json";
import React, {ReactNode} from "react";
import getAllTasks from "./pipelines/Prediction";


/**Main function to initialize all pipelines*/
export const pipelineDefinitions = getAllTasks;

/**A Material UI theme that governs part of the UI. Most UI is set in SCSS*/
export const theme = createTheme({
    palette: {
        primary: {
            main: '#FF7F50ff',
        },
        secondary: {
            main: '#4A5568',
        }
    },
    typography: {
        fontFamily: [
            'OpenSans',
            'sans-serif'
        ].join(','),
    },
});

/**Name for algoithm displayed in top left corner*/
export const algorithmName: string = `SALMA (${packageJson.version})`;

/**Logo for algoithm displayed in top left corner*/
export const algorithmLogo: ReactNode = (
    <svg width="250px" height="250px" viewBox="0 0 250 250" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g id="Favico" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <rect fill="#EF865B" x="0" y="0" width="250" height="250"></rect>
            <polygon id="Path" fill="#FFFFFF" fill-rule="nonzero"
                     points="25.4060646 33.1345418 25.4060646 41.2835943 44.4354284 41.2835943 44.4354284 66.1842161 25.4060646 66.1842161 25.4060646 74.3332686 44.4354284 74.3332686 44.4354284 99.2338904 25.4060646 99.2338904 25.4060646 107.382943 44.4354284 107.382943 44.4354284 132.283565 25.4060646 132.283565 25.4060646 140.432617 44.4354284 140.432617 44.4354284 165.333239 25.4060646 165.333239 25.4060646 173.482291 44.4354284 173.482291 44.4354284 198.382913 25.4060646 198.382913 25.4060646 206.531966 44.4354284 206.531966 44.4354284 225.56133 52.5844809 225.56133 52.5844809 206.531966 77.4851027 206.531966 77.4851027 225.56133 85.6341552 225.56133 85.6341552 206.531966 110.534777 206.531966 110.534777 225.56133 118.683829 225.56133 118.683829 206.531966 143.584451 206.531966 143.584451 225.56133 151.733504 225.56133 151.733504 206.531966 176.634126 206.531966 176.634126 225.56133 184.783178 225.56133 184.783178 206.531966 209.6838 206.531966 209.6838 225.56133 217.832852 225.56133 217.832852 206.531966 244.966828 206.531966 245 245 6 245 6 6 44.4453893 6 44.4453893 33.1339756"></polygon>
            <path
                d="M185.069423,78.3386153 C147.832927,109.304691 114.548695,138.614656 105.236071,188.494 C141.426497,163.512325 189.307707,157.589928 214.677408,127.383903 C240.859163,96.2218142 236.214852,53.1209247 237.638947,9.494 C207.174905,23.8069595 176.998882,31.7414915 146.120812,38.7579618 C87.0308507,52.1888622 62.0331749,115.791126 92.0031841,174.907089 C125.20541,115.519108 149.293025,89.671375 185.069423,78.3386153 Z"
                id="Path" fill="#FFFFFF" fill-rule="nonzero"></path>
        </g>
    </svg>
);

/**Content of the algorithm description screen (click on logo in top left)*/
export const welcomeScreen: ReactNode = (
    <>
        <div className="text-center">
            <h1>SALMA</h1>
            <span className={'col-main'}>v. {packageJson.version}</span>
            <h4><em>S</em>emi <em>A</em>utomated <em>L</em>eaf and <em>M</em>orphology <em>A</em>ssessment </h4>
        </div>
        <div className={'pad-300-top main-text'}>
            SALMA is a tool that allows you to detect leafs in scanned images and extract morphological features from
            them. Please refer to the <a href={"#"}>paper</a> for more information.
        
        </div>
    </>
);