from abc import abstractproperty, abstractmethod
import os
import pickle
from typing import TypeVar, Type


def run():
    pass


if __name__ == '__main__':
    run()


SerializableSubclass = TypeVar('SerializableSubclass', bound="Serializable")

class Serializable:

    OMIT_WARNINGS:bool = True

    """A class that can be serialized and deserialized.
    The idea is to always use dict for storing/pickling data so that there are no
    compatibility issues when class definitions change."""

    def toDict(self)->dict:
        raise NotImplementedError("This class must be implemented")

    @staticmethod
    def fromDict(dict:dict)->"Serializable":
        raise NotImplementedError("This class must be implemented")

    @property
    @abstractmethod
    def defaultPath(self) -> str:
        """Default path for this data file"""
        raise NotImplementedError("This method must be overriden implemented")

    def fileExists(self)->bool:
        """Checks if file has been stored at default location"""
        return os.path.exists(self.defaultPath)

    def saveToDisc(self, path:str = None):
        """Stores the data at the default path"""
        if path is None:
            path = self.defaultPath

        with open(path, "wb") as f:
            pickle.dump(self.toDict(),f)

    @staticmethod
    def load(path, type:Type[SerializableSubclass]) -> SerializableSubclass:

        #can also pass a subclass of FileID
        if not isinstance(path,str):
            path = path.file
        """Loads the classifier. Can either be a dictionary (old way) or the class (new way). Output is always an instance of this class"""
        with open(path, "rb") as f:
            data = pickle.load(f)
            return type.fromDict(data)
