import os
import time

from src.py.SALMA.__libs import mputil
from src.py.SALMA.classes.LeafImage import LeafImage
from src.py.SALMA.classes.TrainedModel import TrainedModel
from src.py.paths import Data
from src.salma.py.eeljsinterface import eeljs_sendProgress
from src.salma.py.util.util import tic, toc


def singlePrediction(model:TrainedModel, imgSrcPath:str, maskOutputPath:str):

    ext = imgSrcPath.split(".")[-1]
    li = LeafImage(imgSrcPath,imgExtension=ext)
    li.predict(model,False)
    li.savePredictedMask(maskOutputPath)

def updateFun(cur:int, total:int):
    eeljs_sendProgress(cur/total, f"Segmenting image {cur}/{total}")

def predict(workingFolder:str, species, processes):

    #collect all images in the working folder/species and load all the models.
    #aggregate into model, image pairs

    modelsBySpecies = {f:Data.getModelFilePath(workingFolder,f) for f in species}
    modelsBySpecies = {f:TrainedModel.load(modelsBySpecies[f]) for f in species}

    #create tuples of model and model file path
    allInputs = []
    for f in species:
        allFiles = Data.getImages(workingFolder,f)
        outPath = Data.getRawPredictionsFolder(workingFolder,f)
        outPath = [outPath + os.path.basename(f).split(".")[0] + ".png" for f in allFiles]
        model = modelsBySpecies[f]
        modelArgs = zip([model]*len(allFiles),allFiles,outPath)
        allInputs.extend(modelArgs)

    updateFun(0,len(allInputs))
    allRes = mputil.runParallel(singlePrediction,allInputs,processes,processes == 1, progressUpdate=updateFun)

    pass

