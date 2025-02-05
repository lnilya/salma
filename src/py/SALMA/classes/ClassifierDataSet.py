from typing import Dict, Optional, Union, List

import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler

from src.py.SALMA.classes.Enums import SubsamplingMethod
from src.py.SALMA.classes.FeatureList import FeatureList
from src.py.SALMA.classes.Serializable import Serializable
from imblearn.under_sampling import RandomUnderSampler



class ClassifierDataSet(Serializable):
    """Stores training or test data a classifier can be using"""

    @staticmethod
    def fromDict(dict:Optional[Dict]) -> Optional['ClassifierDataSet']:
        if dict is None: return None

        return ClassifierDataSet(
            FeatureList.fromDict(dict["_features"]),
            dict["_trImages"],
            dict["X"],
            dict["y"],
            dict.get("_leafProps", None),
            dict.get("_allowDuplicates", False),
            SubsamplingMethod.fromString(dict.get("_subsamplingMethod", None))
        )

    _needsDuplicateCheck = True

    def __init__(self, feats: FeatureList, trainingImages: list[str], X: np.array, y: np.array, leafProps:List[dict] = None, allowDuplicates: bool = False, subsamplingMethod: SubsamplingMethod = None):
        """
        
        :param feats: 
        :param trainingImages:
        :param X: 
        :param y: 
        :param leafProps: List of dictionaries of properties for each leaf in this training dataset. Stores things like area, length, width etc. To later identify leafs in collections of blobs. 
        :param allowDuplicates: 
        """
        self._features = feats
        self._trImages = trainingImages
        self._trImages.sort() #sort by alphabet for comparability
        self._X = X
        self._y = y
        self._allowDuplicates = allowDuplicates
        self._subsamplingMethod = subsamplingMethod
        self._leafProps = leafProps if leafProps is not None else []
        _needsDuplicateCheck = allowDuplicates




    def printStats(self):
        total = len(self._y)
        pos = len(self._y[self._y == 1])
        print(f"Data set from {len(self._trImages)} images and {len(self._y)} labels. Pos: {pos} ({pos/total*100:.2f}%)")
        print(f"Features: {self._features.list}")
        #print proportions of + and - labels

    def subsample(self, numTrainingPoints = 1000, randomState = 42):
        self.dropDuplicates(True)

        #check number of training points, if less than numTrainingPoints, no need to subsample
        if numTrainingPoints is None or len(self._X) < numTrainingPoints is self._subsamplingMethod is None:
            return

        #check if there are enough points to subsample
        if np.sum(self._y == 1) < numTrainingPoints//2 or np.sum(self._y == 0) < numTrainingPoints//2:
            return #not enough points to subsample at least in some classes


        ss = None
        str = {0:numTrainingPoints//2,1:numTrainingPoints//2}

        if self._subsamplingMethod == SubsamplingMethod.Random:
            ss = RandomUnderSampler(sampling_strategy=str, random_state=randomState)
        else:
            raise ValueError("Subsampling method not implemented")

        self._X, self._y = ss.fit_resample(self._X, self._y)

    def dropDuplicates(self, force:bool = False):
        if self._allowDuplicates: return
        if not force and not self._needsDuplicateCheck: return

        # Find unique entries, their first occurrence indices, and counts.
        Xu, indices, inverse_indices, counts = np.unique(
            self._X, axis=0, return_index=True, return_inverse=True, return_counts=True
        )

        # Create an array to store the sum of labels for each unique value.
        label_sums = np.zeros(len(Xu), dtype=float)

        # Use `np.add.at` to sum up the labels for each unique entry.
        np.add.at(label_sums, inverse_indices, self._y)

        # Compute the majority label by rounding and converting to integers (0 or 1).
        new_y = np.round(label_sums / counts).astype(int)
        new_y = new_y == 1

        self._y = new_y
        self._X = Xu
        self._needsDuplicateCheck = False


    #add += operator
    def __iadd__(self, other: 'ClassifierDataSet'):
        if self._X is None:
            #make a copy but keep settings
            self._X = other._X
            self._y = other._y
            self._trImages = other._trImages
            self._leafProps = other._leafProps
            return self

        #check if same images are used
        if len(set(self._trImages).intersection(set(other._trImages))) > 0:
            raise ValueError("The two datasets have images in common. This will duplicate data. Do not do it.")


        self._X = np.vstack([self._X, other._X])
        self._y = np.hstack([self._y, other._y])
        self._trImages += other._trImages
        self._trImages.sort()
        self._leafProps += other._leafProps
        self._needsDuplicateCheck = not self._allowDuplicates

        return self

    def toDict(self, discardData: bool = False) -> Dict:
        """Converts the object to a dictionary
           :param discardData: If true the data is not included, only the variables and the problem"""
        self.dropDuplicates()
        return {
                "X": self._X.astype(np.float32) if not discardData else [],
                "y": self._y if not discardData else [],
                "_features": self._features.toDict(),
                "_trImages": self._trImages,
                "_leafProps": self._leafProps,
                "_allowDuplicates": self._allowDuplicates,
                "_subsamplingMethod": self._subsamplingMethod.name if self._subsamplingMethod is not None else None
                }


    def getStratifiedClassificationDataSplits(self, scale: bool = True, labelEncode: bool = True,
                                              testFolds=5, randomState=None):
        """Returns the test and training splits. Use randomState to get the same results, otherwise the results are randomized."""
        self.dropDuplicates()
        X, y = self._X, self._y
        scaler = None
        encoder = None
        if labelEncode:
            encoder = LabelEncoder()
            y = encoder.fit_transform(y)
        if scale:
            scaler = StandardScaler()
            X = scaler.fit_transform(X)

        allTrains, allTests = [], []

        rkf = StratifiedKFold(n_splits=testFolds, shuffle=True, random_state=randomState)

        for train_index, test_index in rkf.split(X, y):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]

            #allowing duplicates as there are none here.
            allTrains.append(ClassifierDataSet(self._features, self._trImages, X_train, y_train, self._leafProps,True))
            allTests.append(ClassifierDataSet(self._features,self._trImages, X_test, y_test, self._leafProps,True))

        return allTrains, allTests, scaler, encoder

    def getClassificationDataForModelPrediction(self, tm):
        self.dropDuplicates()
        X,y,_,_ = self.getClassificationData(tm.scaler, tm.labelEncoder)
        return X,y
    def getClassificationData(self, scale: Union[bool,StandardScaler] = True, labelEncode: Union[bool,LabelEncoder] = True):
        self.dropDuplicates()
        """Returns the data in a format that can be used by a classifier"""
        X, y = self._X, self._y
        scaler = None
        encoder = None
        if labelEncode:
            if labelEncode is True:
                encoder = LabelEncoder()
            else:
                encoder = labelEncode

            y = encoder.fit_transform(y)
        if scale:
            if scale is True:
                scaler = StandardScaler()
            else:
                scaler = scale

            X = scaler.fit_transform(X)

        return X,y,scaler,encoder
    def getClassificationDataSplit(self, scale: bool = True, labelEncode: bool = True,
                                   testSetSize: float = 0.2):
        """Returns the data in a format that can be used by a classifier"""
        self.dropDuplicates()
        X, y = self._X, self._y
        scaler = None
        encoder = None
        if labelEncode:
            encoder = LabelEncoder()
            y = encoder.fit_transform(y)
        if scale:
            scaler = StandardScaler()
            X = scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=testSetSize, stratify=y)

        trainData = ClassifierDataSet(self._features,  self._trImages, X_train, y_train,self._leafProps, self._allowDuplicates, self._subsamplingMethod)
        testData = ClassifierDataSet(self._features, self._trImages, X_test, y_test,self._leafProps, self._allowDuplicates, self._subsamplingMethod)

        return trainData, testData, scaler, encoder


    @property
    def X(self) -> np.ndarray:
        self.dropDuplicates()

        return self._X

    @property
    def leafProps(self) -> List[dict]:
        return self._leafProps

    @property
    def subsamplingMethod(self) -> SubsamplingMethod:
        return self._subsamplingMethod

    @property
    def y(self) -> np.ndarray:
        self.dropDuplicates()
        return self._y

    @property
    def vars(self) -> FeatureList:
        return self._features


    def __len__(self):
        return len(self._y)
