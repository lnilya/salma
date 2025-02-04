from typing import List, Optional

import numpy as np
import skimage
from PIL import Image
from skimage.color import rgb2gray
from skimage.restoration.uft import laplacian


import os

from skimage.morphology import disk

from src.py.SALMA import GlobalParams
from src.py.SALMA.classes.ClassifierDataSet import ClassifierDataSet
from src.py.SALMA.classes.FeatureList import FeatureList
from src.py.SALMA.classes.Serializable import Serializable
from src.py.SALMA.classes.TrainedModel import TrainedModel
from src.py.SALMA.util import stackImagesIntoGrid


class LeafImage(Serializable):



    def toDict(self) -> dict:
        return {
            "img":self.img,
            "imgPath":self.imgPath,

            "mask":self.mask,
            "_maskProps":self._maskProps,
            "_predictedMask":self._predictedMask,
            "_predictedProps":self._predictedProps,

            "name":self.name,
            "_featuresCache": self._featuresCache
        }
        pass

    @staticmethod
    def fromDict(dict: dict) -> "LeafImage":
        img = LeafImage(None)
        for k in dict:
            setattr(img, k, dict[k])

        return img

    @property
    def defaultPath(self) -> str:
        return self.imgPath.replace(".jpg","_li.pickle")

    def __init__(self, imgOrMaskPath:Optional[str], maskExtension="png", imgExtension="jpg"):

        if imgOrMaskPath is not None:
            if imgOrMaskPath.endswith(imgExtension):
                maskPath = imgOrMaskPath.replace("."+imgExtension, "."+maskExtension)
            elif imgOrMaskPath.endswith(maskExtension):
                maskPath = imgOrMaskPath
                imgOrMaskPath = imgOrMaskPath.replace("."+maskExtension, "."+imgExtension)

            self.imgPath = imgOrMaskPath
            self._maskProps = None
            self._featuresCache = {}
            self.img = np.array(Image.open(imgOrMaskPath))
            #check if file exists
            if os.path.exists(maskPath):
                self.mask = np.array(Image.open(maskPath)) > 0

                if len(self.mask.shape) > 2:
                    self.mask = self.mask[:,:,0]

                propsObj = skimage.measure.regionprops(self.mask.astype(int), self.img)[0]
                self._maskProps = {p:propsObj[p] for p in GlobalParams.Models.leafPropsForComparison}

            else:
                self.mask = None

            #parse a number out of the iamge path
            self.name = os.path.basename(imgOrMaskPath)

            self._predictedMask = None
    def getFolderName(self):
        ip = self.imgPath.split(os.sep)[:-1]
        return os.sep.join(ip) + os.sep

    def addPredictedMask(self, mask2D:np.ndarray):

        if mask2D is None:
            self._predictedMask = None
            self._predictedProps = None
            return

        if mask2D.dtype != bool:
            mask2D = mask2D > 0.5

        self._predictedMask = mask2D


    @property
    def predictedMask(self):
        return self._predictedMask
    #
    # def loadPredictedMask(self, modelName:str):
    #     newPath = PATHS.Results.MaskOutputs + modelName + "/" + self.species + "/" + self.name.replace(".jpg", f".png")
    #     pm = np.array(Image.open(newPath)) > 0
    #     self.addPredictedMask(pm)


    @property
    def species(self):
        return self.name.split("_")[0]
    @property
    def w(self):
        return self.img.shape[1]

    @property
    def h(self):
        return self.img.shape[0]

    def replaceBorders(self, w:int = 3, col = 255):
        self.removeBorder(w)
        self.addBorder(w, col)
    def removeBorder(self, w:int = 3):
        self.img = self.img[w:-w, w:-w]
    def addBorder(self, w:int = 3,col = 255):
        self.img = np.pad(self.img, ((w, w), (w, w), (0, 0)), mode='constant', constant_values=col)

    def predict(self, tm:TrainedModel, returnMaskErrors:bool=True, **maskErrParams):
        y = tm.predict(self.getPredictionData(tm.trainingData.vars))
        self.addPredictedMask(self.reshape1Dto2D(y))
        if returnMaskErrors:
            return self.getMaskErrors(**maskErrParams)

    def reshape1Dto2D(self, y):
        return y.reshape(self.img.shape[0], self.img.shape[1])

    def _getNormedGradient(self, img, ksize = 3):

        _mode = "laplace"

        if _mode == "laplace":
            _, laplace_op = laplacian(img.ndim, (ksize,) * img.ndim)
            grad = np.stack([skimage.filters.laplace(img[:,:,i]) for i in range(3)], axis=2)
            #normalize under the assumption that image is normed 0-1
            maxVal = np.max(np.abs(laplace_op))
            grad = grad / maxVal
        elif _mode == "farid":
            farid:List = [skimage.filters.farid(img[:,:,i]) for i in range(3)]
            grad = np.stack(farid, axis=2)
            #not sure how to normalize

        return grad


    def _getNormedImg(self, colorSpace):
        if colorSpace == "RGB":
            img = self.img / 255
        elif colorSpace == "LAB":

            img = skimage.color.rgb2lab(self.img/255.0)
            #do devision
            img = np.stack([img[:,:,0] / 100, (img[:,:,1] + 86.18302974) / 184.41608361, (img[:,:,2] + 107.85730021) / 202.33542248], axis=2)
        elif colorSpace == "HSV":
            img = skimage.color.rgb2hsv(self.img.astype(np.float32))
            #is noramlized 0-1 already
            img = np.stack([img[:,:,0] , img[:,:,1], img[:,:,2] / 255], axis=2)
        else:
            raise ValueError(f"Unknown color space {colorSpace}")

        return img
    def getPredictionData(self, features:FeatureList, reshapeTo1D = True):

        imgSplits = {}

        if len({"Re","Gr","Bl","I"}.intersection(set(features.list))) > 0:
            imgSplits["RGB"] = self._getNormedImg("RGB")

        if len({"L","A","B"}.intersection(set(features.list))) > 0:
            imgSplits["LAB"] = self._getNormedImg("LAB")

        if len({"H","S","V"}.intersection(set(features.list))) > 0:
            imgSplits["HSV"] = self._getNormedImg("HSV")

        if len({"Lg","Ag","Bg"}.intersection(set(features.list))) > 0:
            imgSplits["LABg"] = self._getNormedGradient(imgSplits.get("LAB", self._getNormedImg("LAB")))

        if len({"Hg","Sg","Vg"}.intersection(set(features.list))) > 0:
            imgSplits["HSVg"] = self._getNormedGradient(imgSplits.get("HSV", self._getNormedImg("HSV")))

        if len({"Reg","Grg","Blg"}.intersection(set(features.list))) > 0:
            imgSplits["RGBg"] = self._getNormedGradient(imgSplits.get("RGB", self._getNormedImg("RGB")))



        X = []
        for v in features:
            if v == "L": X.append(imgSplits["LAB"][:,:,0])
            elif v == "A": X.append(imgSplits["LAB"][:,:,1])
            elif v == "B": X.append(imgSplits["LAB"][:,:,2])
            elif v == "H": X.append(imgSplits["HSV"][:,:,0])
            elif v == "S": X.append(imgSplits["HSV"][:,:,1])
            elif v == "V": X.append(imgSplits["HSV"][:,:,2])
            elif v == "Re": X.append(imgSplits["RGB"][:,:,0])
            elif v == "Gr": X.append(imgSplits["RGB"][:,:,1])
            elif v == "Bl": X.append(imgSplits["RGB"][:,:,2])
            elif v == "Lg": X.append(imgSplits["LABg"][:,:,0])
            elif v == "Ag": X.append(imgSplits["LABg"][:,:,1])
            elif v == "Bg": X.append(imgSplits["LABg"][:,:,2])
            elif v == "Reg": X.append(imgSplits["RGBg"][:,:,0])
            elif v == "Grg": X.append(imgSplits["RGBg"][:,:,1])
            elif v == "Blg": X.append(imgSplits["RGBg"][:,:,2])
            elif v == "Hg": X.append(imgSplits["HSVg"][:,:,0])
            elif v == "Sg": X.append(imgSplits["HSVg"][:,:,1])
            elif v == "Vg": X.append(imgSplits["HSVg"][:,:,2])
            elif v == "I":
                intensity = rgb2gray(imgSplits["RGB"])
                X.append(intensity)
            else: raise ValueError(f"Unknown feature {v}")

        X = np.stack(X, axis=2)

        if reshapeTo1D:
            return X.reshape(-1,len(features))

        return X

    def toTrainingData(self, features:FeatureList, **cdsParam):
        if features.name in self._featuresCache:
            cc = self._featuresCache[features.name]
            return ClassifierDataSet(features, [self.imgPath], cc[0], cc[1],cc[2],**cdsParam)

        trainingData = self.getPredictionData(features)
        trainingLabels = self.mask.reshape(-1)

        regProps = skimage.measure.regionprops(self.mask.astype(int), self.img)
        if len(regProps) != 1:
            raise ValueError("Mask seems corrupted, as it should only one part")
        # convert regionprops to dictionary
        rdict = {k: regProps[0][k] for k in regProps[0] if k in GlobalParams.Models.leafPropsToSave}

        self._featuresCache[features.name] = (trainingData, trainingLabels, [rdict])

        return self.toTrainingData(features, **cdsParam)


    def _toTrainingDataFill(self, features:FeatureList):
        """Classification is either 0 or 1 depending whether the pixel is part of the leaf or not"""


    def plotAllFeatures(self, features:FeatureList, maskWithGroundTruth:bool = False,**plotParams):
        imgs = self.getPredictionData(features,False)
        if maskWithGroundTruth:
            for i in range(imgs.shape[-1]):
                imgs[:,:,i] = imgs[:,:,i] * self.mask

        if plotParams.get("plot",None) is None:
            plotParams["plot"] = True

        return stackImagesIntoGrid(imgs, **plotParams)

    def savePredictedMask(self, path:str):
        Image.fromarray(self._predictedMask.astype(np.uint8)*255).save(path)

    def saveImage(self, path:str = None):
        if path is None:
            path = self.imgPath
        Image.fromarray(self.img).save(path)