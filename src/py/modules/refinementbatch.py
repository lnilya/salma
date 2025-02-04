import os
import shutil

import numpy as np
import skimage
from PIL import Image
from scipy.ndimage import binary_fill_holes
from skimage.morphology import disk
from tqdm import tqdm
from typing_extensions import Callable

from src.py.SALMA.__libs import mputil, pyutil
from src.py.modules.RefinementFile import RefinementFile
from src.py.paths import Data
from src.salma.py.eeljsinterface import eeljs_sendProgress


def generateOutlinePolygons(binaryImg=None, lblImg=None, abortSignal:Callable=None):
    """Generates a subsampled closed polygon for each blob in labelMsk."""

    if lblImg is None:
        lblImg = skimage.measure.label(binaryImg, connectivity=1)

    # We have to go blob by blobs, as label find conotours might not do the numbering in the same order
    subsampledContours = []
    img_max = lblImg.max()
    for i in tqdm(range(1, img_max + 1)):
        cntImg = lblImg == i
        #assume a single blob int he image, find the smallest/largest x and y value of the blob, then cut out the image fragment

        minx, miny = np.min(np.where(cntImg), axis=1)
        maxx, maxy = np.max(np.where(cntImg), axis=1)

        #add border of 1 unless at zero/max
        minx = max(0, minx - 1)
        miny = max(0, miny - 1)
        maxx = min(cntImg.shape[0], maxx + 2)
        maxy = min(cntImg.shape[1], maxy + 2)

        cntImg = cntImg[minx:maxx, miny:maxy]
        cnts = skimage.measure.find_contours(binary_fill_holes(cntImg), 0.5, fully_connected='low')
        subsampledContours += [c[::10].astype(int) for c in cnts]
        #add the minx,miny
        for c in subsampledContours[-1]:
            c[0] += minx
            c[1] += miny

        eeljs_sendProgress(i / img_max, f"Generating contours {i}/{img_max}")
        if abortSignal is not None:
            if abortSignal(): raise Exception("Aborted")
        #abort if abort signal was recieved

    # for c in cnts: subsampledContours += [c[::10].astype(int)]

    # figure out the labels for each contour

    # convert to an array of dictionaries {x,y,lbl}
    subsampledContours = [{"x": c[:, 1].tolist(), "y": c[:, 0].tolist(), "lbl": i} for i, c in
                          enumerate(subsampledContours)]

    return subsampledContours


def fillSmallHolesRelative(mask: np.ndarray, minSize: float, keeponlybiggest:bool , abortSignal:Callable=None ):
    labels = skimage.measure.label(mask)
    props = skimage.measure.regionprops(labels)

    if keeponlybiggest:
        maxAreaLbl = np.argmax([p.area for p in props])
        labels = labels == props[maxAreaLbl].label
        labels = labels.astype(np.uint8)
        props = skimage.measure.regionprops(labels)

    # Create an empty mask to store the result
    result_mask = np.zeros_like(labels, dtype=bool)
    numProps = len(props)
    for i,prop in enumerate(props):

        eeljs_sendProgress(i / numProps, f"Closing holes in leaf {i}/{numProps}")
        # Calculate the maximum hole size for the# current object

        if minSize == 100:
            closed_object = binary_fill_holes(labels == prop.label)
        else:
            max_hole_size = int(prop.area * minSize / 100)

            # Create a mask for the current object
            object_mask = labels == prop.label

            # Remove small holes within the object
            closed_object = skimage.morphology.remove_small_holes(object_mask, area_threshold=max_hole_size)

        # Add the closed object to the result mask
        result_mask = np.logical_or(result_mask, closed_object)

        if abortSignal is not None:
            if abortSignal(): raise Exception("Aborted")

    return result_mask


def refine(rawImg: np.ndarray, minSize: int, maxHoleSize: int, openingsize: int, keeponlybiggest: bool,
           generateContours: bool = True, abortSignal:Callable=None):
    mask = np.copy(rawImg)
    pyutil.tic()
    if abortSignal is None:
        abortSignal = lambda: False

    if openingsize > 0:
        # open and close mask - equivalent to a morphological denoising
        eeljs_sendProgress(-1, "Morphological smoothing...")
        mask = skimage.morphology.binary_opening(mask, disk(openingsize))
    #pyutil.toctic("Holes")
    if abortSignal(): raise Exception("Aborted")

    if minSize > 0 and not keeponlybiggest:
        eeljs_sendProgress(-1, "Removing small objects...")
        mask = skimage.morphology.remove_small_objects(mask, minSize)

    if abortSignal(): raise Exception("Aborted")

    #pyutil.toctic("Opening")
    if maxHoleSize > 0:
        # remove holes below a certain size
        mask = fillSmallHolesRelative(mask, maxHoleSize, keeponlybiggest, abortSignal)

    if abortSignal(): raise Exception("Aborted")
    #pyutil.toctic("Small objects")

    # identify blobs in the mask
    eeljs_sendProgress(-1, "Identifying objects...")
    labels = skimage.measure.label(mask, connectivity=1)
    props = skimage.measure.regionprops(labels)

    if abortSignal(): raise Exception("Aborted")

    #pyutil.toctic("Labeling")
    if keeponlybiggest:
        maxAreaLbl = np.argmax([p.area for p in props])
        labels = labels == props[maxAreaLbl].label
        mask = labels

    #pyutil.toctic("Keep only biggest")

    if abortSignal(): raise Exception("Aborted")

    if generateContours:
        contours = generateOutlinePolygons(lblImg=labels, abortSignal=abortSignal)
    else:
        contours = None

    #pyutil.toctic("Contours")

    return mask, contours, []


def updateFun(cur: int, total: int):
    eeljs_sendProgress(cur / total, f"Segmenting image {cur}/{total}")


def singleRefine(file: str, params:dict):
    rawSegmentedImg, hasRaw = Data.getPredictionFromImg(file)
    if not hasRaw: return False
    rawSegmentedImg = np.array(Image.open(rawSegmentedImg)) > 0
    refinedSegemnetedImg, _, _ = refine(rawSegmentedImg, params["minsize"][0],
                                        params["maxholesize"][0], params["openingsize"][0], params["keeponlybiggest"],
                                        False)

    refinedSegementedImgPath = Data.getRefinedPredictionFromImg(file, False)
    filteredSegementedImgPath = Data.getFilteredRefinedPredictionFromImg(file, False)
    Image.fromarray((refinedSegemnetedImg).astype(np.uint8) * 255).save(refinedSegementedImgPath)
    Image.fromarray((refinedSegemnetedImg).astype(np.uint8) * 255).save(filteredSegementedImgPath)

    return True

def batchRefine(wf:str, species:str, ncpus:int, params, abortSignal:Callable):

    #get the output folders
    refPreds = Data.getRefinedPredictionsFolder(wf,species)
    filtPreds = Data.getFilteredRefinedPredictionsFolder(wf,species)

    #clear both folders
    shutil.rmtree(refPreds, ignore_errors=True)
    shutil.rmtree(filtPreds, ignore_errors=True)
    os.makedirs(refPreds)
    os.makedirs(filtPreds)

    allFiles = Data.getImages(wf, species)
    allArgs = []
    for f in allFiles:
        allArgs += [[f,params]]
    updateFun(0, len(allFiles))
    res = mputil.runParallel(singleRefine, allArgs, ncpus, ncpus == 1, progressUpdate=updateFun, checkForAbort=abortSignal)

    #update the settings file
    curSettings = {"minsize": params["minsize"][0],
                   "maxholesize":params["maxholesize"][0],
                   "openingsize":params["openingsize"][0],
                   "keeponlybiggest":params["keeponlybiggest"],
                   "ex":[]}

    progressFiles = RefinementFile()
    progressFiles.load(wf, species)
    for i,f in enumerate(allFiles):
        progressFiles[f] = curSettings

    progressFiles.save()

    return {"success": np.count_nonzero(res), "total": len(res)}
