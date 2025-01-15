import os

import pandas as pd
import numpy as np
import skimage.measure
from PIL import Image

from src.py.SALMA.__libs import mputil, pyutil
from src.py.modules.salmapredictions import singlePrediction
from src.py.paths import Data
from src.salma.py.eeljsinterface import eeljs_sendProgress

leafProps = {
    "eccentricity":{ "name": "Eccentricity", "single":True,"dpiExp":-1},
    "axis_major_length":{ "name": "Axis Major Length", "single":True,"dpiExp":1,"unit":["px","mm"]},
    "axis_minor_length":{ "name": "Axis Minor Length", "single":True,"dpiExp":1,"unit":["px","mm"]},
    "solidity":{ "name":"Solidity", "single":True,"dpiExp":-1},
    "perimeter":{ "name":"Perimeter", "single":True,"dpiExp":1,"unit":["px","mm"]},
    "area":{ "name":"Area", "single":False,"dpiExp":2,"unit":["px²","mm²"]},
}

def exportSingle(maskFilePath:str, sum:bool, species:str, splitter:str = None, dpi:int = 0):

    maskImg = np.array(Image.open(maskFilePath)) > 0
    name = maskFilePath.split(os.sep)[-1].split(".")[0]
    template = {"File":name, "Species":species, "Element":0}

    if splitter:
        for i,s in enumerate(name.split(splitter)):
            template["Descriptor %d"%i] = s

    rows = []

    props = [l for l in leafProps if not leafProps[l]["single"]] if sum else leafProps.keys()
    lblImg = skimage.measure.label(maskImg)
    regions = skimage.measure.regionprops(lblImg)
    for i,r in enumerate(regions):
        singleRow = template.copy()
        singleRow["Element"] = i
        for prop in props:
            singleRow[prop] = r[prop]

        rows.append(singleRow)
        #compute the total area

    df = pd.DataFrame(rows)
    if dpi > 0:
        #convert px to mm or mm^2 where needed
        for p in props:
            dpiExp = leafProps[p]["dpiExp"]
            if dpiExp == -1: continue
            df[p] = df[p] * ((25.4/dpi)**dpiExp)

    if sum:
        #sum the calue columns only
        df = df.groupby(["File","Species"]).sum().reset_index()
        df.drop(columns=["Element"], inplace=True)

    #rename columns
    for p in leafProps:
        if p in df.columns:
            prefix = "Total " if sum else ""
            unit = leafProps[p].get("unit",["",""])[0 if dpi == 0 else 1]
            postfix = " ("+unit+")" if unit else ""
            df.rename(columns={p:prefix + leafProps[p]["name"] + postfix}, inplace=True)


    return df

def updateFun(cur: int, total: int):
    eeljs_sendProgress(cur / total, f"Exporting image {cur}/{total}")

def exportBatch(wf:str, species:list[str], exportCollective:bool, ncpus:int, sum:bool, splitter:str = None, dpi:int = 0):
    allArgs = []
    for s in species:
        allFiles = Data.getFinalPredictedImages(wf,s)
        for f in allFiles:
            allArgs.append((f,sum,s,splitter,int(dpi)))

    updateFun(0, len(allArgs))
    res = mputil.runParallel(exportSingle, allArgs, ncpus, ncpus == 1, progressUpdate=updateFun)

    totalDF = pd.concat(res)

    if not wf.endswith(os.sep):
        wf = wf + os.sep

    if exportCollective:
        pyutil.writePandasToCSV(totalDF, wf + "Export.csv", index=False)
    else:
        allGr = totalDF.groupby("Species")
        for sp, speciesData in allGr:
            pyutil.writePandasToCSV(speciesData, wf + str(sp) + os.sep + "Export.csv", index=False)


if __name__ == '__main__':
    wf = '/Users/artifex/Desktop/WF/'
    exportBatch(wf,["Coriaria arborea","Bicolor Shrub"],True,7,False,"_",600)
    # t = '/Users/artifex/Desktop/WF/Prumnopitys ferruginea/_filteredPredictions/Prumnopitys ferruginea_0.png'
    # df = exportSingle(t,True,"Prumnopitys ferruginea",splitter="",dpi=600)
    k = 0
