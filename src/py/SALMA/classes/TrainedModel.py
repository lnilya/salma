import os.path
import pickle
from typing import Union

import numpy as np
from sklearn.inspection import PartialDependenceDisplay
from sklearn.preprocessing import StandardScaler, LabelEncoder

from src.py.SALMA.classes.ClassifierDataSet import ClassifierDataSet
from src.py.SALMA.classes.Enums import ModelType
from src.py.SALMA.classes.Serializable import Serializable
import plotly.graph_objects as go
import plotly.express as px

class TrainedModel(Serializable):

    """
    A class that stores all the data of a trained classifier including training and test data, scalers and label encoders.
    The idea is that this class can be pickled and stored in a file. This file can then be loaded and used to predict
    """

    modelID:ModelType
    modelName:str

    trainingData: ClassifierDataSet
    testData: ClassifierDataSet

    scaler:StandardScaler
    labelEncoder:LabelEncoder

    testScore: float
    trainScore: float

    trainedClassifier:any

    def __init__(self, modelname:str, modelID: ModelType | str, trainData:ClassifierDataSet, testData:ClassifierDataSet = None,
                       scaler:StandardScaler = None, labelEncoder:LabelEncoder = None,
                       testScore:float = -1, trainScore:float = -1,
                       trainedClassifier:any = None):
        self.modelName = modelname
        self.modelID = modelID if isinstance(modelID,ModelType) else ModelType[modelID]
        self.trainingData = trainData
        self.testData = testData
        self.scaler = scaler
        self.labelEncoder = labelEncoder
        self.testScore = testScore
        self.trainScore = trainScore
        self.trainedClassifier = trainedClassifier

    def visualizePDPPlot(self,dimX:str,dimY:str, data:ClassifierDataSet = None):
        if data is None:
            data = self.trainingData._X


        X,yl = data.getClassificationDataForModelPrediction(self)
        res = PartialDependenceDisplay.from_estimator(self.trainedClassifier,
                                                      X,
                                                      [[dimX,dimY]],
                                                      feature_names=self.trainingData.vars.list,
                                                      grid_resolution=20,
                                                      n_jobs=10,percentiles=(0.01,0.99), verbose=1)

        pdp = res.pd_results
        x = pdp[-1].grid_values[0]
        y = pdp[-1].grid_values[1]
        z = pdp[-1].average[0].T
        f = go.Figure()
        f.add_contour(x=x, y=y, z=z, showlegend=False, showscale=False, colorscale="RdBu")
        # f.add_scatter(x=X[:,self.trainingData.vars.list.index(dimX)],
        #               y=X[:,self.trainingData.vars.list.index(dimY)], mode="markers", marker=dict(color=yl, colorscale="RdBu", size=5))
        f = data.visDataset(1000,[dimX,dimY],f, self.scaler,quantileBounds=0.01)
        f.show()
        k = 0


        k = 0
        pass

    def visualizeDecisionBoundary(self, trData:ClassifierDataSet, varX:str, varY:str):
        pass

    def toDict(self, discardDatasets:bool = False) -> dict:
        return {
            "name": self.modelName,
            "modelID": self.modelID.value,
            "trainingData": self.trainingData.toDict(discardDatasets) if self.trainingData is not None else None,
            "testData": self.testData.toDict(discardDatasets) if self.testData is not None else None,
            "scaler": self.scaler,
            "labelEncoder": self.labelEncoder,
            "testScore": self.testScore,
            "trainScore": self.trainScore,
            "trainedClassifier": self.trainedClassifier,
        }

    @staticmethod
    def fromDict(dict: dict) -> "TrainedModel":
        return TrainedModel(
            dict["name"],
            ModelType[dict["modelID"]],
            ClassifierDataSet.fromDict(dict.get("trainingData", None)),
            ClassifierDataSet.fromDict(dict.get("testData", None)),
            dict["scaler"],
            dict["labelEncoder"],
            dict["testScore"],
            dict["trainScore"],
            dict["trainedClassifier"],
        )

    def predictEnsemble(self,X:np.ndarray) -> np.ndarray:
        """Returns a prediction 0-1 for the increase in abundance. 0 being decrease and 1 being increase."""
        assert "Ensemble" in self.modelID.value, "Only ensemble models can predict using predictEnsemble"
        if len(self.trainingData.vars) != X.shape[1]:
            raise ValueError("The number of features seems different from training data.")

        y = self.trainedClassifier.predict_proba(self.scaler.transform(X))
        y = y.astype(np.float32)
        return y

    def predict(self, X:np.ndarray, probabilistic:bool = True) -> np.ndarray:
        """Predicts the data and returns it as True/False. Data is also scaled according to the scalers
        saved in the model. Pass the unscaled X values. """

        if "Ensemble" in self.modelID.value:
            if probabilistic:
                return self.predictEnsemble(X)
            else:
                raise ValueError("Todo Needs to be implemented, hard voting for ensemble models")
        if len(self.trainingData.vars) != X.shape[1]:
            raise ValueError("The number of features seems different from training data.")

        if probabilistic:
            y = self.trainedClassifier.predict_proba(self.scaler.transform(X))
            return y[:,1]

        y = self.trainedClassifier.predict(self.scaler.transform(X))
        y = self.labelEncoder.inverse_transform(y)
        return y.astype(bool)


    def saveToDisc(self, discardDatasets:bool = False, path:str = None):
        if path is None: return
        with open(path, "wb") as f:
            pickle.dump(self.toDict(discardDatasets),f)

    @staticmethod
    def load(path:str)-> "TrainedModel":
        tm = None
        if os.path.exists(path):
            tm = Serializable.load(path, TrainedModel)
        return tm