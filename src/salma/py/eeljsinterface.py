import eel

#This file contains functions that can be called from PY to JS.

#Sends progress of current step to JS interface
def eeljs_sendProgress(progress:float, msg:str = None):
    try:
        eel.progress(progress,msg)
    except:
        #This happens on windows if the function is executred in a child process.
        pass
        
