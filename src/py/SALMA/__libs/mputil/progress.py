import time
from typing import Callable, List
import multiprocessing
import tqdm
from tqdm import tqdm
import threading


def _wrapper(args):
    #Check if is dictionary or list
    if isinstance(args,dict):
        func = args.pop('func')
        return func(**args)
    else:
        func = args[0]
        return func(*args[1:])

def runParallel(func:Callable, args:List,poolSize:int=11, debug=False, progressMessage:str = None, progressUpdate:Callable = None):
    """
    Runs a function in parallel with a progress bar
    :param func: Function to run
    :param args: List of arguments to pass to the function, either as named dictionary arguments or as a numbered list.
    :param poolSize: Pool size Number of processes to use
    :param debug: If true, run in debug mode (no parallelization, all runs in main process)
    :return: List of results Whatever the function returns
    """

    #Add func to args
    if isinstance(args[0], dict):
        args = [dict(func=func,**arg) for arg in args]
    else:
        args = [(func,*arg) for arg in args]

    results = []
    if debug:
        for a in tqdm(args):
            results.append(_wrapper(a))
    else:
        if progressUpdate is None:
            pbar = tqdm(total=len(args), desc=progressMessage)
            progressUpdate = lambda cnt,total: pbar.update(1)

        with multiprocessing.Manager() as manager:
            #create a counter variable to keep track of progress that is shared between processes
            _counter = manager.Value('i', 0)
            _lock = manager.Lock()

            #The progress update must be run in the parent process, since otherwise on windows no update is shown (as it spawns a new process and eel looses the JS function bindings).
            #Therefore we run the progress monitor in the parent process but a separate theread and update the progress bar in real-time.
            def progress_monitor():
                """Runs in a separate thread in the parent process and updates progress in real-time."""
                while _counter.value < len(args):
                    progressUpdate(_counter.value, len(args))
                    time.sleep(0.5)  # Check progress every 0.5 seconds

            # Start the progress monitor in a separate thread
            progress_thread = threading.Thread(target=progress_monitor, daemon=True)
            progress_thread.start()

            with multiprocessing.Pool(processes=poolSize) as pool:
                for result in pool.imap(_wrapper, args):
                    results.append(result)
                    with _lock:
                        _counter.value += 1

            progress_thread.join()

    print("") #Clear line
    return results