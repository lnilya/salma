from src.salma.py.ModuleConnector import ModuleConnector
from src.salma.py.SessionData import SessionData
from src.salma.py.modules.ModuleBase import ModuleBase


class YourModuleConnector(ModuleConnector):

    def initializeModule(self, moduleName: str, session: SessionData) -> ModuleBase:
        if moduleName == 'Training And Segmentation':
            from src.py.modules.ModelTraining import ModelTraining
            return ModelTraining(moduleName, session)
        if moduleName == 'Refinement':
            from src.py.modules.Refinement import Refinement
            return Refinement(moduleName, session)
        if moduleName == 'Export':
            from src.py.modules.Export import Export
            return Export(moduleName, session)

        # %NEW_MODULE%
        # Keep the New Module Comment at this location, for automatically adding new modules via scripts. Do not delete it, or the script will not work.
