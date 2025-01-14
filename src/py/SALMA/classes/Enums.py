from enum import Enum
from typing import TypeVar, List, Union

import pandas as pd
from typing_extensions import Optional

from src.py.SALMA.classes.FeatureList import FeatureList


class SubsamplingMethod(Enum):
    Centroids = "Centroids"
    ActiveLeaning = "ActiveLeaning"
    Random = "Random"

    def fromString(s:Optional[str])->Optional["SubsamplingMethod"]:
        if s is None: return None
        for m in SubsamplingMethod:
            if m.value == s:
                return m
        return None


class ModelType(Enum):
    """Type of model being used"""
    SALMA = "SALMA"
    GLMQ = "GLMQ"
    RFMINI = "RFMINI" #Random Forest with very few estimators
    RF = "RF" #Random Forest
    TREE = "DT" #Decision Tree
    SVMW = "SVMW" #Support Vector Machine with balanced class weights
    SVMWLin = "SVMWLin" #Linear SVM
    GLM = "GLM" #Generalized Linear Model
    ANN1 = "ANN1" #Neural Network with 1 hidden layer

    KNN = "KNN" #Support Vector Machine
    LSKNN = "LSKNN" #Label Spreading
    LSRBF = "LSRBF" #Label Spreading

    ## Those can't be trained but are the result of the training. Since training error is estimated through 4 fold cross validation
    # The result are 4 models. An option is to use these 4 models in an ensemble fashion.
    # Alternatively retrain the entire model on the full dataset. (these retrained models will retain the original SVM enum label)
    SVMWEnsemble = "SVMWEnsemble" #Support Vector Machine
    RFEnsemble = "RFEnsemble" #Support Vector Machine
    GLMEnsemble = "GLMEnsemble" #Support Vector Machine

    def isEnsemble(self):
        return "Ensemble" in self.value

    def parseToNonEnsembleVersion(self):
        if "Ensemble" in self.value:
            return ModelType(self.value.replace("Ensemble",""))
        return self
    def parseToEnsembleVersion(self):
        if "Ensemble" not in self.value:
            return ModelType(self.value + "Ensemble")
        return self


class Features:
    """A list of variables that can be used for prediction purposes with names for identifying them."""
    LAB = FeatureList("Lab", "L,A,B".split(","))
    Intensity = FeatureList("Int", ["I"])
    Colors = FeatureList("Cols", "Re,Gr,Bl,L,A,B,S,V".split(","))
    ColorsAndGradients = FeatureList("ColsGrad", "Re,Gr,Bl,L,A,B,S,V".split(",") + "Reg,Grg,Blg,Lg,Ag,Bg,Sg,Vg".split(","))
    Gradients = FeatureList("Grads", "Reg,Grg,Blg,Lg,Ag,Bg,Sg,Vg".split(","))

    @staticmethod
    def fromString(s:str)->FeatureList:

        #Get by name
        obj = getattr(Features, s, None)
        if isinstance(obj, FeatureList):
            return obj

        #Get by ID... since sometimes diferent
        #search through all attributes that are instances of VariableList
        for v in vars(Features):
            obj = getattr(Features, v)
            if isinstance(obj, FeatureList):
                if obj.name == s:
                    return obj
    @staticmethod
    def toClearText(fl:Union[FeatureList,list[str]])->List[str]:

        def transform(s:str)->str:
            if s == "L": return "Lightness (LAB)"
            if s == "A": return "Green-Red (A) (LAB)"
            if s == "B": return "Blue-Yellow (B) (LAB)"
            if s == "Re": return "Red"
            if s == "Gr": return "Green"
            if s == "Bl": return "Blue"
            if s == "S": return "Saturation (HSV)"
            if s == "V": return "Value (HSV)"
            if s == "Lg": return "Lightness Gradient (LAB)"
            if s == "Ag": return "Green-Red (A) Gradient (LAB)"
            if s == "Bg": return "Blue-Yellow (B) Gradient (LAB)"
            if s == "Sg": return "Saturation Gradient (HSV)"
            if s == "Vg": return "Value Gradient (HSV)"
            if s == "Reg": return "Red Gradient"
            if s == "Grg": return "Green Gradient"
            if s == "Blg": return "Blue Gradient"
            return s

        lst = fl if isinstance(fl, list) else fl.list
        return [transform(s) for s in lst]


class ErrorMetrics:

    @staticmethod
    def toClearText(s:Union[str,List[str]], addWordError:bool = False)->List[str]:
        if isinstance(s,str):
            return [s]

        r = []
        add = " Error" if addWordError else ""
        for metric in s:
            if metric == "area_ratio":
                r += ["Area" + add]
            elif metric == "perimeter_ratio":
                r += ["Perimeter" + add]
            elif metric == "axis_major_length_ratio":
                r += ["Major Axis"  + add]
            elif metric == "axis_minor_length_ratio":
                r += ["Minor Axis" + add]
            elif metric == "eccentricity_ratio":
                r += ["Eccentricity" + add]
            else:
                r += [metric]

        return r
