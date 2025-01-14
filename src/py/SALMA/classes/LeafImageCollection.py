import math
import os
from typing import List

import numpy as np
import plotly.express as px
from PIL import Image

import src.py.SALMA.__libs.pyutil as pyutil
from src.py.SALMA.__libs.osutil import dirutil
from src.py.SALMA.classes.Enums import SubsamplingMethod
from src.py.SALMA.classes.FeatureList import FeatureList
from src.py.SALMA.classes.LeafImage import LeafImage
from src.py.SALMA.classes.Serializable import Serializable


class LeafImageColection(Serializable):

    @property
    def defaultPath(self) -> str:
        return self.defaultPath

    @staticmethod
    def fromDict(dict: dict) -> "Serializable":
        imgArr = [LeafImage.fromDict(i) for i in dict["allImages"]]
        return LeafImageColection.fromImageArray(imgArr, dict["usedForTraining"])

    def toDict(self) -> dict:
        return {
            "allImages": [i.toDict() for i in self.allImages],
            "usedForTraining": self.usedForTraining
        }



    def __init__(self, filePattern:str = None):
        if filePattern is not None:
            allItems = dirutil.getAllFiles(filePattern)
            self.allImages = []
            for f in allItems:
                self.allImages.append(LeafImage(f))

            self.allImages.sort(key=lambda x: x.number)
            self.usedForTraining = [False] * len(self.allImages)

            self._defaultPath = self.allImages[0].getFolderName() + "allImages.pickle"

    def toTrainingData(self, features:FeatureList, subsampling:int,subsamplingMethod=SubsamplingMethod.Random):
        cd = None
        for i in self.allImages:
            licd = i.toTrainingData(features, allowDuplicates=True, subsamplingMethod=subsamplingMethod)
            licd.subsample(subsampling)
            if cd is None: cd = licd
            else: cd += licd

        return cd
    @staticmethod
    def fromImageArray(data:List[LeafImage], usedForTraining:List[bool] = None):
        l = LeafImageColection(None)

        #take the path of the first imaage and replace the name

        l.defautPath = data[0].getFolderName() + "allImages.pickle"

        #sort data by number in LeafImage
        data.sort(key=lambda x: x.number)

        l.allImages = data
        l.usedForTraining = usedForTraining if usedForTraining is not None else [False] * len(data)

        return l

    def storePredictedMasks(self, folder):
        for li in self.allImages:
            li.savePredictedMask(folder + os.path.basename(li.imgPath).replace("jpg", "png"))

    @property
    def avgW(self):
        return np.mean([i.w for i in self.allImages])

    @property
    def avgH(self):
        return np.mean([i.h for i in self.allImages])

    def buildTrainingDataCaches(self, f:FeatureList):
        for i in self.allImages:
            i.toTrainingData(f)

    #make iterable
    def __iter__(self):
        return iter(self.allImages)

    def __getitem__(self, item):
        return self.allImages[item]

    def __len__(self):
        return len(self.allImages)

    def storeDatasetToImage(self, namePattern:str, sheetW:int, sheetH:int, subsample:int = 1, border:int = 3, constPaddingVal = 255, highlightTrainingSet:bool = True, ignorePredictionMasks:bool = False, ignoreIfExists:bool = False):
        raise NotImplementedError()
        """Plots all images on a grid with the given width and height"""
        maxW = math.ceil(max([i.w for i in self.allImages])/subsample) + 2*border
        maxH = math.ceil(max([i.h for i in self.allImages])/subsample) + 2*border

        numRowsPerSheet = sheetH // maxH
        numColsPerSheet = sheetW // maxW

        #crop sheets
        sheetH = maxH * numRowsPerSheet
        sheetW = maxW * numColsPerSheet

        numElOnSheet = numRowsPerSheet * numColsPerSheet
        numSheets = math.ceil(len(self.allImages) / (numRowsPerSheet * numColsPerSheet))

        #translates index to sheet, row, col tuple
        idToSheetRowCol = lambda i: (i // numElOnSheet, (i%numElOnSheet) // numColsPerSheet, (i%numElOnSheet) % numColsPerSheet )

        sheets = [np.ones((sheetH, sheetW, 3), np.uint8) * constPaddingVal for i in range(numSheets)]

        if ignoreIfExists:
            if np.all([os.path.exists(PATHS.Results.predictionsFolder + namePattern.format(i)) for i in range(numSheets)]):
                return

        for i in range(len(self.allImages)):
            sheet,row,col = idToSheetRowCol(i)
            img = self.allImages[i]
            mask = img.predictedMask
            img = img.img
            wasUsedForTraining = self.usedForTraining[i] and highlightTrainingSet

            #add the image onto the mask
            if mask is not None and not ignorePredictionMasks:
                #darken all pixels outside the mask by 90%
                # img[~mask] = img[~mask] * 0.3
                img = img.copy()
                img[~mask] = 255


            #subsample
            if subsample > 1:
                img = pyutil.subsampleAndAverage(img, subsample)

            #highlight with red border images used for training
            if wasUsedForTraining:
                hb = 3
                img = img[hb:-hb, hb:-hb]
                paddedImage = np.full((img.shape[0] + 2*hb, img.shape[1] + 2*hb, 3), (255,0,0), np.uint8)
                paddedImage[hb:-hb, hb:-hb] = img
                img = paddedImage


            #add grid border to RGB image
            img = np.pad(img, ((border, border), (border, border), (0, 0)), mode='constant', constant_values=constPaddingVal)

            imgOffsetR = (maxH - img.shape[0]) // 2
            imgOffsetC = (maxW - img.shape[1]) // 2


            #write into sheet
            sheets[sheet][row*maxH + imgOffsetR:row*maxH + imgOffsetR + img.shape[0], col*maxW + imgOffsetC:col*maxW + imgOffsetC + img.shape[1], :] = img

        #crop last sheet to row/col
        lastMaxRows = min((row + 1) * maxH, sheetH)
        sheets[-1] = sheets[-1][:lastMaxRows, : , :]

        if namePattern is None: #consider it for debug
            px.imshow(sheets[0]).show()
            return

        for i,sheet in enumerate(sheets):

            imgName = PATHS.Results.predictionsFolder + namePattern.format(i)
            #write the image to disk
            Image.fromarray(sheet).save(imgName)
            # print(f"Saved {imgName}")





