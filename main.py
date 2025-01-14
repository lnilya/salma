# This is a sample Python script.
import os
# Press ⌃R to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions, and settings.

import time

from src.py.SALMA.__libs import mputil


def print_hi(name):
    # Use a breakpoint in the code line below to debug your script.
    print(f'Hi, {name}')  # Press ⌘F8 to toggle the breakpoint.
    time.sleep(1)

def upd(cur,total):
    print(f"Progress{os.getpid()}: {cur}/{total}")

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    args = [("a",),("b",),("c",),("d",),("e",)]
    mputil.runParallel(print_hi,args,5,False,progressUpdate=upd)

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
