
from src.salma.py.modules.ModuleBase import ModuleBase
import os
import src.py.paths as paths

months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']


class ModelTraining(ModuleBase):

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'ModelTraining'
        self.trace('initialized')

    def unpackParams(self,subsampling, workingfolder, **other):
        return subsampling,workingfolder

    def createSubfolders(self,speciesFolders):

        for f in speciesFolders:
            # create the model subfolder
            if not os.path.exists(f + paths.Data.modelSubfolder):
                os.makedirs(f + paths.Data.modelSubfolder)

            # create the raw predictions subfolder
            if not os.path.exists(f + paths.Data.rawPredictionsSubfolder):
                os.makedirs(f + paths.Data.rawPredictionsSubfolder)

            # create the refined predictions subfolder
            if not os.path.exists(f + paths.Data.refinedPredictionsSubfolder):
                os.makedirs(f + paths.Data.refinedPredictionsSubfolder)

            if not os.path.exists(f + paths.Data.filteredPredictionsSubfolder):
                os.makedirs(f + paths.Data.filteredPredictionsSubfolder)

    def trainScpecies(self,speciesFolder,subsample):
        from src.py.SALMA.classes.ClassifierDataSet import ClassifierDataSet
        from src.py.SALMA.classes.Enums import Features
        from src.py.SALMA.classes.LeafImageCollection import LeafImageColection
        from src.py.SALMA.core.training import trainClassifier

        if  not os.path.exists(speciesFolder):
            return

        lic = LeafImageColection(speciesFolder + paths.Data.modelSubfolder + "*.jpg")
        cd:ClassifierDataSet = lic.toTrainingData(Features.ColorsAndGradients, subsample)

        speciesName = speciesFolder.split(os.sep)[-2]
        modelPath = speciesFolder + paths.Data.modelSubfolder + speciesName + ".salma"
        tm = trainClassifier(speciesName, cd, silent=True,saveModelPath=modelPath)

        return tm

    def run(self, action, params):
        from src.py.SALMA.__libs import pyutil


        #Parse Parameters out of the dictionary arriving from JS
        subsampling,workingfolder = self.unpackParams(**params)
        numcpus = os.cpu_count()

        if workingfolder[-1] != os.sep:
            workingfolder += os.sep

        if action == 'loadAndCreate':

            import pandas as pd
            from src.py.SALMA.classes.TrainedModel import TrainedModel
            #get all Folders in working folder
            allSpecies = os.listdir(workingfolder)
            allSpecies = [workingfolder+f+os.sep for f in allSpecies if os.path.isdir(os.path.join(workingfolder,f))]
            self.createSubfolders(allSpecies)

            res = []

            #load models that might be present
            for f in allSpecies:
                speciesName = f.split(os.sep)[-2]
                modelPath = f + paths.Data.modelSubfolder
                #get number of jpg,png or tif files
                numFiles = len([name for name in os.listdir(f) if os.path.isfile(os.path.join(f,name)) and name.endswith(('.jpeg','.jpg','.png','.tif','.tiff'))])
                #get number of jpg,png or tif files inside the model folder
                numTrainingFiles = len([name for name in os.listdir(modelPath) if os.path.isfile(os.path.join(modelPath,name)) and name.endswith(('.jpeg','.jpg'))])
                #get number of png inside the prediction folders
                numRawPredictions = len([name for name in os.listdir(f + paths.Data.rawPredictionsSubfolder) if os.path.isfile(os.path.join(f + paths.Data.rawPredictionsSubfolder,name)) and name.endswith('.png')])
                numRefinedPredictions = len([name for name in os.listdir(f + paths.Data.refinedPredictionsSubfolder) if os.path.isfile(os.path.join(f + paths.Data.refinedPredictionsSubfolder,name)) and name.endswith('.png')])

                #load Model file
                modelFilePath = modelPath + speciesName + ".salma"
                tm = TrainedModel.load(modelFilePath)
                if tm is not None:
                    #get file modification time
                    mtime = os.path.getmtime(modelFilePath)
                    mnumimgs = len(tm.trainingData._trImages)
                    #convert mtime to readable timestamp with minutes
                    month = months[int(pd.Timestamp(mtime,unit='s').strftime('%m'))-1]
                    mtime = pd.Timestamp(mtime,unit='s').strftime(f'%H:%M:%S on {month} %d, %Y')

                    score = tm.testScore
                    res += [[speciesName,numFiles, numTrainingFiles,numRawPredictions,numRefinedPredictions,mtime,score,mnumimgs]]
                else:
                    res += [[speciesName,numFiles, numTrainingFiles,numRawPredictions,numRefinedPredictions,-1,-1,-1]]




            res = pd.DataFrame(res,columns=['id','Images','Training Images','Raw Predictions','Refined Predictions','Mtime',"MScore","MNumImgs"])

            #Generate an output that will go to javascript for displaying on the UI side
            self.trace('Finished')
            return {
                'info': res.to_dict(orient="records")
            }
        elif action == "training":
            from tqdm import tqdm
            from src.salma.py.eeljsinterface import eeljs_sendProgress


            eeljs_sendProgress(0.01)
            total = len(params["species"])
            cur = 0
            for s in tqdm(params["species"]):
                eeljs_sendProgress(cur/total, f"Training {s} ({cur+1}/{total})")
                self.trainScpecies(workingfolder + s + os.sep, subsampling[0])
                cur += 1
                if self.abortSignal():
                    raise RuntimeError('Aborted execution.')

            return self.run('loadAndCreate',params)

        elif action == "prediction":
            from src.salma.py.eeljsinterface import eeljs_sendProgress
            from src.py.modules.salmapredictions import predict

            eeljs_sendProgress(0.01)

            predict(workingfolder, params["species"], numcpus, self.abortSignal)

            #return the same data as before
            return self.run('loadAndCreate',params)

        raise ValueError('Unknown action %s'%action)