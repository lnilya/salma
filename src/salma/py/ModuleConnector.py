import abc
from typing import Dict

from src.salma.py.SessionData import SessionData
from src.salma.py.modules.ModuleBase import ModuleBase


class ModuleConnector(metaclass=abc.ABCMeta):

    @abc.abstractmethod
    def initializeModule(self, moduleName: str, session: SessionData) -> ModuleBase:
        """
        creates an instance of module given its id.
        Args:
            moduleName (str): Name of the module, defined in the params file of the module on JS side. This identifies the class to be instantiated on py side.
            params (Dict): A dictionary with parameters passed from JS. They are defined in the serverParameters field of the PipelineStep type in the pipeline definition.
            Useful especially if you have multiple modules with different IDs but same name. That is you are using the same class but different instances on py side. Parameters allow
            you to configure these somehow.
            session (SessionData): The SessionData object, storing and receiving inputs/outputs of the whole pipeline.

        Returns:
            A new instance of a Module (subclass of ModuleBase)
        """
        pass
