import os
from enum import Enum

import numpy as np
import skimage
from PIL import Image
from matplotlib.pyplot import contour
from scipy.ndimage import binary_fill_holes


from src.py.modules.RefinementFile import RefinementFile
from src.py.modules.exporter import exportBatch
from src.py.modules.refinementbatch import generateOutlinePolygons, refine, batchRefine
from src.py.paths import Data
from src.salma.py.modules.ModuleBase import ModuleBase
from src.salma.py.util.imgutil import getPreviewImage
from plotly import express as px

#make enum with some keys

class Export(ModuleBase):

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Export'
        self.trace('initialized')

    def unpackParams(self,species,exportsum,splitter,dpi, **other):
        return species,exportsum,splitter,dpi

    def stripFilePath(self, s):
        return s.split(os.sep)[-1].split(".")[0]

    def run(self, action, params):

        #Parse Parameters out of the dictionary arriving from JS
        workingfolder = params["workingfolder"]

        if action == 'loadInfo':
            res = {}
            #get all Folders in working folder
            allSpecies = Data.getAllSpecies(workingfolder)
            for s in allSpecies:
                predictedImages = Data.getFinalPredictedImages(workingfolder,s)
                res[s] = {"name":s, "exportableFiles": [self.stripFilePath(i) for i in predictedImages]}

            #getImages
            return res
        elif action == 'export':
            type = params["type"]
            species,exportsum,splitter,dpi = self.unpackParams(**params)

            exportSpecies = []
            if type == "single":
                exportSpecies = [species]
            else:
                exportSpecies = Data.getAllSpecies(workingfolder)

            ncpus = os.cpu_count()

            exportBatch(workingfolder,exportSpecies,type=="all",ncpus,exportsum,splitter,dpi)

            return True

        raise ValueError('Unknown action %s'%action)