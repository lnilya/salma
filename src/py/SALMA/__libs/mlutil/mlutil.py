from typing import List, Union

import numpy as np
import pandas as pd
from scipy import stats as stats
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from src.py.SALMA.__libs.pyutil import writePandasToCSV, writeExcelWithSheets
from src.py.SALMA.classes.FeatureList import FeatureList


def getGaussianKernel(kernelWidth, normTo=None, numberPoints=None):
    """
    Gaussian kernel with a width of kernelWidth.
    :param kernelWidth: The width of the kernel in each direction, equals half the standard deviation
    :param numberPoints: The number of points to use. If None, the kernel is returned -kw to +kw and contians kw*2 + 1 points.
    :param normTo: If not None, the kernel is normalized to this value, otherwise it is gaussian
    :return: a numpy array of the x values and the kernel values (y)
    """
    if numberPoints is None:
        numberPoints = kernelWidth * 2 + 1

    x = np.linspace(-kernelWidth, kernelWidth, numberPoints)

    kernel = stats.norm.pdf(x, scale=kernelWidth / 2)

    # Adjust the kernel so that the height at 0 is 1, this way we can sum up the weights at a point
    # and get an estimate how many plots contribute to the decision at this year.
    if normTo is not None:
        kernel /= np.max(kernel)
        kernel *= normTo

    return x, kernel


def runPCA(xDF:Union[pd.DataFrame,np.ndarray], nComponents:int, stdScale:bool = True, addAsColumnsToDataFrame:List[str] = None, columnsinDF:Union[List[str],FeatureList] = None):
    """
    Run PCA on the dataframe xDF and return the transformed dataframe and the explained variance per component and the eigenvalues
    :param xDF: A dataframe containing the values
    :param nComponents: Number of PC component s to use
    :param stdScale: If true will standard scale the dat first
    :param addAsColumnsToDataFrame: If not None will add the PCs as columns under these names. Pass [] to autaomtically name PC1...N
    :param columnsinDF: Columns to use in the dataframe. Will use all if None.
    :param storePCAInfoTo: If not None, will store the PCA information to this pickle file.Will also contain the transformer for applying later
    :return: Dataframe (possibly modified), explained variance per component, eigenvalues, transformed values, unit vectors in PC space
    """

    if columnsinDF is not None:
        if isinstance(columnsinDF, FeatureList):
            varList = columnsinDF
            columnsinDF = columnsinDF.list
        else:
            varList = FeatureList("PCVariables", columnsinDF)

        X = xDF[columnsinDF].to_numpy()
    else:
        X = xDF

    if stdScale:
        scaler = StandardScaler()
        X = scaler.fit_transform(X)

    pca = PCA(n_components=nComponents)
    principalComponents = pca.fit_transform(X)

    #Add back to the dataframe
    if addAsColumnsToDataFrame is not None:
        if len(addAsColumnsToDataFrame) == 0:
            addAsColumnsToDataFrame = [f"PC{i+1}" for i in range(nComponents) ]
        for i, name in enumerate(addAsColumnsToDataFrame):
            xDF[name] = principalComponents[:,i]
    else:
        xDF = principalComponents

    #compute the projections of the unit vectors
    uv = np.diag(np.ones(X.shape[1]))
    uv = pca.transform(uv)

    #Compute explained variance per component and the eigenvalues
    return xDF, pca.explained_variance_ratio_, pca.explained_variance_, pca.components_, uv


def getKDE(vals:np.ndarray, range = None, numP = 100):
    kde0 = stats.gaussian_kde(vals)

    if range is None:
        range = (np.nanmin(vals), np.nanmax(vals))

    x = np.linspace(range[0], range[1], numP)
    y = kde0(x)
    return x,y
