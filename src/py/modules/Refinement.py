import os
from enum import Enum

import numpy as np
import skimage
from PIL import Image
from matplotlib.pyplot import contour
from scipy.ndimage import binary_fill_holes


from src.py.modules.RefinementFile import RefinementFile
from src.py.modules.refinementbatch import generateOutlinePolygons, refine, batchRefine
from src.py.paths import Data
from src.salma.py.modules.ModuleBase import ModuleBase
from src.salma.py.util.imgutil import getPreviewImage
from plotly import express as px

#make enum with some keys
class RefinementKeys(Enum):
    WFContent = 'Refinement'

class Refinement(ModuleBase):

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'ModelTraining'
        self.trace('initialized')
        self.progressFiles = RefinementFile()

    def unpackParams(self,workingfolder,file,minsize,maxholesize,openingsize,species,keeponlybiggest, **other):
        return workingfolder,file,minsize[0],maxholesize[0],species, openingsize[0],keeponlybiggest


    def stripFilePath(self, s):
        return s.split(os.sep)[-1].split(".")[0]

    def saveSelectedRefinedImage(self):
        #save the refined image
        Image.fromarray((self.refinedSegemnetedImg).astype(np.uint8)*255).save(self.refinedSegementedImgPath)

        if len(self.excludedContours) > 0:
            lbl = skimage.measure.label(self.refinedSegemnetedImg)
            for i in self.excludedContours:
                lbl[lbl == (i+1)] = 0
            #save the refined image without the excluded contours
            Image.fromarray((lbl > 0).astype(np.uint8)*255).save(self.filteredSegementedImgPath)
        else:
            #just a copy of the original file.
            Image.fromarray((self.refinedSegemnetedImg).astype(np.uint8)*255).save(self.filteredSegementedImgPath)



    def run(self, action, params):

        #Parse Parameters out of the dictionary arriving from JS
        workingfolder,file,minsize,maxholesize,species,openingsize,keeponlybiggest = self.unpackParams(**params)

        if action == 'loadInfo':
            res = {}
            #get all Folders in working folder
            allSpecies = Data.getAllSpecies(workingfolder)
            for s in allSpecies:
                allFiles = {img:self.stripFilePath(img) for img in Data.getImages(workingfolder, s)}
                rawPredictions = set([self.stripFilePath(img) for img in Data.getRawPredictions(workingfolder, s)])
                refinedPredictions = set([self.stripFilePath(img) for img in Data.getRefinedPredictions(workingfolder, s)])

                #Create a dictionary with booleans saying if the predictions are present for each file.
                newS = []
                for path,name in allFiles.items():
                    newS += [{"path":path,"name":name, "raw":name in rawPredictions, "refined": name in refinedPredictions}]

                #sort alphabetically by name
                res[s] = sorted(newS, key=lambda x: x["name"])

            #getImages
            return res
        elif action == "selectoutline":
            self.excludedContours = params["excludedIDs"]
            self.progressFiles[file].update({"ex":self.excludedContours})
            self.saveSelectedRefinedImage()
            self.progressFiles.save()
            return True
        elif action == "batchrefine":
            #get all files for the species
            allFiles = Data.getImages(workingfolder,species)
            #get the number of CPUs to use
            ncpus = os.cpu_count()

            return batchRefine(workingfolder,species,ncpus,params)

        elif action == "selectimage":
            force = params.get("force",False)
            #get the correct progress file and load the raw image
            self.progressFiles.load(workingfolder,species)
            self.colImg = np.array(Image.open(file))
            self.rawSegmentedImg,hasRaw = Data.getPredictionFromImg(file)
            if not hasRaw: raise ValueError('No initial segmentation found for %s'%file)
            self.rawSegmentedImg = np.array(Image.open(self.rawSegmentedImg)) > 0
            self.refinedSegementedImgPath,hasRefined = Data.getRefinedPredictionFromImg(file)
            self.filteredSegementedImgPath = Data.getFilteredRefinedPredictionFromImg(file,False)

            outdatedSettings = False
            curSettings = { "minsize":minsize, "maxholesize":maxholesize, "openingsize":openingsize, "keeponlybiggest":keeponlybiggest}
            regenerated = False

            if not hasRefined or force:
                #run the refinement and return the polygons and polygon selection
                self.refinedSegemnetedImg, self.contours, self.excludedContours =  refine(self.rawSegmentedImg,minsize,maxholesize,openingsize,keeponlybiggest,True, abortSignal=self.abortSignal)
                curSettings["ex"] = self.excludedContours
                self.progressFiles[file] = curSettings
                regenerated = True
                #save the refined image to tmp and save the settings file for later access
                self.progressFiles.save()
                self.saveSelectedRefinedImage()
            else:
                #load the refined image and the settings
                self.refinedSegemnetedImg = np.array(Image.open(self.refinedSegementedImgPath)) > 0
                self.contours = generateOutlinePolygons(binaryImg = self.refinedSegemnetedImg, abortSignal=self.abortSignal)

                self.excludedContours = self.progressFiles[file].get("ex",[])
                outdatedSettings = not self.progressFiles.areSettingsEqual(file,curSettings)

            return {
                "refinedImage":getPreviewImage(self.refinedSegemnetedImg, species + "_ref_" + file.split(os.sep)[-1], True),
                "rawImage": getPreviewImage(self.rawSegmentedImg, species + "_raw_" + file.split(os.sep)[-1], True),
                "scannedImage": getPreviewImage(self.colImg, species + "_col_" + file.split(os.sep)[-1], True),
                "contours":self.contours,
                "excludedContours":self.excludedContours,
                "folderinfo": self.run("loadInfo",params),
                "outdatedSettings":outdatedSettings
            }


        raise ValueError('Unknown action %s'%action)