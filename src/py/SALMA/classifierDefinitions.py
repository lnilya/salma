import copy
import platform
import math

from sklearn import svm
from sklearn.ensemble import RandomForestClassifier
from sklearn.gaussian_process.kernels import RBF, Matern, RationalQuadratic
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.semi_supervised import LabelSpreading
from sklearn.tree import DecisionTreeClassifier

from src.py.SALMA import LocalSettings
from src.py.SALMA.classes.Enums import ModelType
from src.py.SALMA.classes.FeatureList import FeatureList

kernel_options = ([RBF(length_scale=l, length_scale_bounds=(1e-5, 1e7)) for l in [0.01, 0.1, 1, 10, 50]] +
                  [Matern(length_scale=l, nu=n, length_scale_bounds=(1e-5, 1e7)) for l in [0.1, 1, 10] for n in
                   [0.5, 1.5, 2.5]] +
                  [RationalQuadratic(length_scale=l, alpha=a, alpha_bounds=(1e-5, 1e7)) for l in [0.1, 1, 10, 100] for a
                   in [0.01, 0.1, 1, 10, 100]])

# _score = "f1"
_score = "accuracy"

trainingParams = {
    "normImages": True #If true each image is scaled 0-1 in intensity before being used for training or prediction.
}

QuadraticGLMPipeline = Pipeline([
    ('poly', PolynomialFeatures(degree=2)),  # Quadratic expansion
    ('logistic', LogisticRegression(class_weight="balanced", max_iter=50000))
])

classifiers = {
    ModelType.ANN1: #ANN with single hidden layer
        GridSearchCV(MLPClassifier(solver="adam", max_iter=50000),
                     param_grid={
                         'hidden_layer_sizes': [(1/36),(0.05), (0.075), (0.1), (0.125), (0.15), (0.25), (0.5)],
                         # in % of the input layers, will be transformed before use.
                         'activation': ['tanh', 'relu'],
                         'alpha': [0.0001, 0.001, 0.01, 0.1],
                         'learning_rate': ['constant', 'invscaling', 'adaptive'],
                         'learning_rate_init': [0.001, 0.01, 0.1]
                     },
                     scoring=_score,
                     cv=5, n_jobs=11),

    ModelType.SVMW:
        GridSearchCV(svm.SVC(kernel='rbf', class_weight="balanced"),
                     param_grid={"C": [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 100, 1000, 10000],
                                 "gamma": [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 100, 1000, 10000, "scale", "auto"]},
                     scoring=_score,
                     cv=5, n_jobs=11),
    ModelType.SVMWLin:
        GridSearchCV(svm.SVC(kernel="linear", class_weight="balanced"),
                     param_grid={"C": [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 100, 1000, 10000]},
                     scoring=_score,
                     cv=5, n_jobs=11),
    ModelType.KNN:
        GridSearchCV(KNeighborsClassifier(),
                     param_grid={"n_neighbors": [2, 3, 4, 5, 7, 10],
                                 "weights": ["uniform", "distance"]},
                     scoring=_score,
                     cv=5, n_jobs=11),

    ModelType.GLM: GridSearchCV(LogisticRegression(class_weight="balanced", max_iter=50000),
                                param_grid={"C": [0.1, 1, 100, 1000, 10000, 50000, 100000, 500000, 1000000]},
                                scoring=_score,
                                cv=5, n_jobs=8),
    ModelType.SALMA: GridSearchCV(LogisticRegression(class_weight="balanced", max_iter=50000),
                                param_grid={"C": [0.1,1, 100, 1000, 10000, 50000, 100000, 500000, 1000000],
                                            # "solver": ["lbfgs", "liblinear","newton-cholesky","sag","saga"]
                                            },
                                scoring=_score,
                                cv=5, n_jobs=8),
    ModelType.GLMQ: GridSearchCV(QuadraticGLMPipeline,
                                param_grid={"logistic__C": [1, 100, 1000, 10000, 50000, 100000, 500000, 1000000]},
                                scoring=_score,
                                cv=5, n_jobs=8),

    ModelType.RF: GridSearchCV(RandomForestClassifier(),
                               param_grid={"max_depth": [4, 5, 6, 7, 8, 9, 10],
                                           "n_estimators": [50, 100, 200, 300, 400, 500],
                                           'min_samples_split': [2, 5, 10]},
                               scoring=_score,
                               cv=5, n_jobs=11),
    ModelType.RFMINI: GridSearchCV(RandomForestClassifier(),
                               param_grid={"max_depth": [4, 6, 10, 15],
                                           "n_estimators": [3, 5, 7, 10, 15, 20]},
                               scoring=_score,
                               cv=5, n_jobs=11),

    ModelType.TREE: GridSearchCV(DecisionTreeClassifier(),
                                    param_grid={"max_depth": [4, 5, 6, 7, 8, 9, 10,12,15]},
                                    scoring=_score,
                                    cv=5, n_jobs=11),


    ModelType.LSKNN: GridSearchCV(LabelSpreading(kernel='knn', max_iter=1000),
                                  param_grid={"alpha": [0.1, 0.25, 0.5, 0.75, 0.9], "n_neighbors": [2, 3, 4, 5, 7, 10]},
                                  scoring=_score,
                                  cv=5, n_jobs=11),
    ModelType.LSRBF: GridSearchCV(LabelSpreading(kernel='rbf', max_iter=1000),
                                  param_grid={"alpha": [0.1, 0.25, 0.5, 0.75, 0.9]},
                                  scoring=_score,
                                  cv=5, n_jobs=11)
}


def getClassifier(t: ModelType, vars: FeatureList):
    if t.isEnsemble():
        t = t.parseToNonEnsembleVersion()
    sv = classifiers[t]

    # TODO: Currently there is a bug related to pyInstaller and multiprocessing preventing proper parallelizing of the training. Will be disabled here, but needs to be implemented.
    sv.n_jobs = 1
    # maxJobs = math.prod([len(v) for v in sv.param_grid.values()]) * sv.cv
    # sv.n_jobs = min(maxJobs, LocalSettings.maxNumProcesses)

    if t == ModelType.ANN1:
        clf = copy.deepcopy(sv)
        hiddenLayerRel = clf.param_grid["hidden_layer_sizes"]
        newSizes = []
        for i, h in enumerate(hiddenLayerRel):
            if isinstance(h, float):
                newSizes.append(max(1, math.ceil(h * len(vars))))
            else:
                newSizes.append(tuple([max(1, math.ceil(hin * len(vars))) for hin in h]))

        newSizes = list(set(newSizes))

        clf.param_grid["hidden_layer_sizes"] = newSizes
        return clf

    return sv


if __name__ == "__main__":
    # compute the number of combinations

    print("Classifier definitions loaded.")
