import os


class Data:

    allowedFileExtensions = ["jpg","jpeg","png","tif","tiff"]

    modelSubfolder = "_models" + os.sep
    rawPredictionsSubfolder = "_rawPredictions" + os.sep
    refinedPredictionsSubfolder = "_predictions" + os.sep
    filteredPredictionsSubfolder = "_filteredPredictions" + os.sep

    @staticmethod
    def getRawPredictionsFolder(wf:str, species:str):
        if wf[-1] != os.sep: wf += os.sep
        speciesFolder = species + os.sep
        return wf + speciesFolder + Data.rawPredictionsSubfolder

    @staticmethod
    def getRefinedPredictionFromRawPrediction(rawPath:str, checkExists:bool = True):
        path = rawPath.replace(Data.rawPredictionsSubfolder, Data.refinedPredictionsSubfolder)
        if checkExists:
            return path, os.path.exists(path)
        return path
    @staticmethod
    def getPredictionFromImg(imgPath:str, checkExists:bool = True):
        imgName = imgPath.split(os.sep)[-1]
        imgNameNew = Data.rawPredictionsSubfolder + imgName
        newPath = imgPath.replace(imgName, imgNameNew)
        newPath = newPath.split(".")[0] + ".png"
        if checkExists:
            return newPath, os.path.exists(newPath)


        return newPath
    @staticmethod
    def getRefinedPredictionFromImg(imgPath:str, checkExists:bool = True):
        imgName = imgPath.split(os.sep)[-1]
        imgNameNew = Data.refinedPredictionsSubfolder + imgName
        newPath = imgPath.replace(imgName, imgNameNew)
        newPath = newPath.split(".")[0] + ".png"
        if checkExists:
            return newPath, os.path.exists(newPath)
        return newPath
    @staticmethod
    def getFilteredRefinedPredictionFromImg(imgPath:str, checkExists:bool = True):
        imgName = imgPath.split(os.sep)[-1]
        imgNameNew = Data.filteredPredictionsSubfolder + imgName
        newPath = imgPath.replace(imgName, imgNameNew)
        newPath = newPath.split(".")[0] + ".png"
        if checkExists:
            return newPath, os.path.exists(newPath)
        return newPath
    @staticmethod
    def getRefinedPredictionsFolder(wf:str, species:str):
        if wf[-1] != os.sep: wf += os.sep
        speciesFolder = species + os.sep
        return wf + speciesFolder + Data.refinedPredictionsSubfolder
    @staticmethod
    def getFilteredRefinedPredictionsFolder(wf:str, species:str):
        if wf[-1] != os.sep: wf += os.sep
        speciesFolder = species + os.sep
        return wf + speciesFolder + Data.filteredPredictionsSubfolder

    @staticmethod
    def getModelFilePath(wf:str, species:str):
        if wf[-1] != os.sep: wf += os.sep
        speciesFolder = species + os.sep
        return wf + speciesFolder + Data.modelSubfolder + species + ".salma"
    @staticmethod
    def getAllSpecies(wf:str)->list:
        if wf[-1] != os.sep: wf += os.sep
        #get all folder names
        return [f for f in os.listdir(wf) if os.path.isdir(os.path.join(wf,f))]

    @staticmethod
    def getFinalPredictedImages(wf:str, species:str, fileExtensions:str = None)->list:
        allImg = Data.getImages(wf, species, fileExtensions)
        res = []
        for img in allImg:
            rImg,exists = Data.getFilteredRefinedPredictionFromImg(img)
            if exists: res.append(rImg)

        return res

    @staticmethod
    def getImages(wf:str, species:str, fileExtensions:str = None)->list:
        if wf[-1] != os.sep: wf += os.sep
        speciesFolder = species + os.sep
        #get all files in the folder that have the allowed extensions
        if fileExtensions is None:
            fileExtensions = Data.allowedFileExtensions

        return [wf+speciesFolder + f for f in os.listdir(wf + speciesFolder) if os.path.isfile(os.path.join(wf + speciesFolder,f)) and f.endswith(tuple(fileExtensions))]

    @staticmethod
    def getSettingsFilePath(wf:str, species:str):
        return Data.getRefinedPredictionsFolder(wf,species) + "__settings.json"

    @staticmethod
    def getRawPredictions(wf:str, species:str)->list:
        if wf[-1] != os.sep: wf += os.sep
        folder = Data.getRawPredictionsFolder(wf,species)
        #get all png files within that folder
        return [folder + f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder,f)) and f.endswith(".png")]
    @staticmethod
    def getRefinedPredictions(wf:str, species:str)->list:
        if wf[-1] != os.sep: wf += os.sep
        folder = Data.getRefinedPredictionsFolder(wf,species)
        #get all png files within that folder
        return [folder + f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder,f)) and f.endswith(".png")]


