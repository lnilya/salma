from typing import List, Union

import numpy as np

import plotly.express as px

def stackImagesIntoGrid(imgArray3D:Union[np.ndarray,List], numrows:int = None, borderWidth:int = 0, borderFillValue:int = 0, norm:bool = True, plot:bool = False):

    if isinstance(imgArray3D, list):
        imgArray3D = np.stack(imgArray3D, axis=2)

    imgRows,imgCols = imgArray3D.shape[0] + 2*borderWidth, imgArray3D.shape[1]+ 2*borderWidth
    numStacks = imgArray3D.shape[2]


    if numrows is None:
        numrows = int(np.ceil(np.sqrt(numStacks)))

    numcols = int(np.ceil(numStacks / numrows))

    newImg = np.zeros((numrows*imgRows, numcols*imgCols))
    for r in range(numrows):
        for c in range(numcols):
            if r*numcols+c >= numStacks: continue
            data = imgArray3D[:,:,r*numcols+c]
            if norm:
                data = (data - np.min(data)) / (np.max(data) - np.min(data))

            if borderWidth > 0:
                data = np.pad(data, ((borderWidth, borderWidth), (borderWidth, borderWidth)), mode='constant', constant_values=borderFillValue)

            newImg[(r*imgRows):((r+1)*imgRows), (c*imgCols):((c+1)*imgCols)] = data

    if plot: #in grayscale
        px.imshow(newImg, color_continuous_scale='gray').show()

    return newImg

