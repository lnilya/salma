import numpy as np
from scipy.odr import Model

from src.py.SALMA.classes.PretrainedVotingClassifier import PretrainedVotingClassifier
from src.py.SALMA.classifierDefinitions import getClassifier

from src.py.SALMA.__libs import pyutil
from src.py.SALMA.classes.ClassifierDataSet import ClassifierDataSet
from src.py.SALMA.classes.Enums import ModelType
from src.py.SALMA.classes.TrainedModel import TrainedModel
import platform
def train(clf,X,y):
    if platform.system() == 'Windows':
        clf.fit(X, y)
    else:
        from sklearn.utils import parallel_backend
        with parallel_backend('multiprocessing'):
            clf.fit(X, y)

    return clf
def trainClassifier(name:str, cd:ClassifierDataSet, mt:ModelType = ModelType.SALMA, ensembleFolds:int = 5, silent=False, saveModelPath:str = None, returnTime:bool = False, numcpus:int = 8):

    if returnTime:
        pyutil.tic()

    if mt.isEnsemble():
        trainDatas,testDatas, scale,encode = cd.getStratifiedClassificationDataSplits(testFolds=ensembleFolds, randomState=42)
    else:
        train,test, scale,encode = cd.getClassificationDataSplit()
        trainDatas,testDatas = [train],[test]

    allTest = []
    allTrain = []
    allClassifiers = []
    allParams = []
    clf = getClassifier(mt, cd.vars)
    # for i, trData in tqdm(enumerate(trainDatas), desc=f"Training {mt.name}", total=len(trainDatas)):
    for i, trData in enumerate(trainDatas):
        testData = testDatas[i]

        X,y, _ , _ = trData.getClassificationData(False,False)
        Xtest, ytest, _, _ = testData.getClassificationData(False,False)

        clf.fit(X,y)
        allClassifiers += [clf.best_estimator_]
        allParams += [clf.best_params_]
        allTest += [clf.score(Xtest, ytest)]
        allTrain += [clf.score(X,y)]



    bestIdx = np.argmax(allTest)
    worstIdx = np.argmin(allTest)

    if mt.isEnsemble():
        #store the voting classifier
        clfv = PretrainedVotingClassifier(allClassifiers)
        votingClassifier = TrainedModel(name, mt.parseToEnsembleVersion(), trData, testData,scale,encode, allTest[bestIdx], allTrain[bestIdx], clfv)
        votingClassifier.saveToDisc(True,saveModelPath)


    if not silent:
        print("Training best estimator with hyperParams on full dataset", allParams[bestIdx])

    #train the final model on the entire dataset
    X,y,scale,encode = cd.getClassificationData(True,True)
    clbest = clf.estimator
    clbest.set_params(**allParams[bestIdx])
    clbest.fit(X,y)
    trainScore = clbest.score(X,y)
    #store the best classifier as a single result

    singleClassifier = TrainedModel(name, mt.parseToNonEnsembleVersion(), trData, testData,scale,encode, allTest[bestIdx], trainScore, clbest)
    singleClassifier.saveToDisc(True,saveModelPath)

    if not silent:
        print(f"Trained {mt.name}. {clf.scoring}: {np.mean(allTest):.3f} (Train:{trainScore:.3f}) ")

    if returnTime:
        trTime = pyutil.tocr()
        return singleClassifier, trTime

    return singleClassifier

