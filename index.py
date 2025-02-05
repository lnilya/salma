from multiprocessing import freeze_support
from multiprocessing import set_start_method
if __name__ == '__main__':
    freeze_support()
    import platform
    if platform.system() != 'Windows':
        print("Setting start method to fork")
        set_start_method('fork', force=True)


# coding: utf-8
import os
print(f"Starting Process {os.getpid()} (Parent: {os.getppid()})  ({__name__}): " )

if __name__ == '__main__':
    print("Starting Server (May take a while)...")
    import sys

    from src.salma.py import settings
    from src.salma.py import eelutil
    from src.salma.py.eelinterface import *

    if '--develop' in sys.argv:
        while True:
            print("")
            print("Starting Server in Developer mode http://localhost:3000")
            eel.init('public')
            eelutil.emptyTmpFolder(settings.TMP_FOLDER)
            k = eel.start(port = settings.EEL_PORT,
                      host = settings.EEL_HOST)

    else:
        print("")
        print('Visit http://%s:%d in your browser to use software' % (settings.EEL_HOST, settings.EEL_PORT))
        print('On first run it may take a while for the server to be receptive. So if you can\'t reach the site in your browser wait a little bit and reload.')
        print('Please report any bugs or suggestions to the Github repository.')
        eel.init('build')
        eelutil.emptyTmpFolder(settings.TMP_FOLDER)
        eel.start(port = settings.EEL_PORT,
                  host = settings.EEL_HOST)
        # eel.start('index.html',
        #           port = settings.EEL_PORT,
        #           host = settings.EEL_HOST)
