import json
import os

from src.py.paths import Data


class RefinementFile:

    def __init__(self):
        self.settings = None
        self.activeFilePath = None
        pass

    def load(self, wf:str, species:str):
        self.activeFilePath = Data.getSettingsFilePath(wf, species)
        if os.path.exists(self.activeFilePath):
            try:
                with open(self.activeFilePath, 'r') as f:
                    self.settings = json.load(f)
            except:
                print("Error loading settings file. Initializing empty settings-")
                self.settings = {}
        else:
            self.settings = {}

    def save(self):
        if self.activeFilePath is not None:
            with open(self.activeFilePath, 'w') as f:
                json.dump(self.settings, f)

    def areSettingsEqual(self, file, compareSettings):
        fileSettings = self[file]
        for key in compareSettings:
            if key not in fileSettings:
                return False
            if fileSettings[key] != compareSettings[key]:
                return False
        return True

    def __getitem__(self, filepath:str):
        if self.settings is None: raise ValueError("No settings loaded")
        key = filepath.split(os.sep)[-1].split(".")[0]
        return self.settings.get(key,{})

    def __setitem__(self, filepath, value):
        if self.settings is None: raise ValueError("No settings loaded")
        key = filepath.split(os.sep)[-1].split(".")[0]
        self.settings[key] = value


