import math
import os
from typing import List

import numpy as np
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


