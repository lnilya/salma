# SALMA
Semi-Automated Leaf Morphology Analysis

If you just want to use the software, please download the executables and follow the in-app tutorial videos. 
If you want to debug and extend the softeware, follow the instructions below on how to setup this repository.

## Download Executable

Please click "Releases" in the right sidebar and download the latest release for your operating system.
Check out the YouTube walkthrough of how this works: https://youtu.be/j2TIpCErm9o

Issues: 
- On initial startup the software will build a lot of caches, be patient if the first click on some menu items takes a while. This will only happen once.
- On **Windows only** the training of the models can't be parallelized, because of an issue with multiprocessing and PyInstaller. The training step therefore will take longer on Windows. In practice the training takes only seconds to minutes.

## Tech Stack

The main libraries used in SALMA are:

__Javascript Based__

- React and Typescript for UI development
- SASS for styling
- Recoil for state management
- Material UI for UI components
- create-react-app for development/build environment

__Python based__
- Eel / Bottle for websocket communication
- PyInstaller for creating executables

Tested on NPM 18.0 and Python 3.11 

On Windows use Python 3.9.11 as there seems to be an issue with visual studio build tools and Python 3.11. It might work on your machine though.

# Setting up Develompent Environment

It is much easier to use an IDE like pycharm, hence it will do most installation steps for you.

## 1. Setting Up Virtual Environment
You should have python installed. If not here is a link: https://www.python.org/downloads/release/python-31111/

All the below steps assume you are in the root folder, where this readme file is located. If not open the console and type in
```
cd path/to/my/folder
```

First thing you need to do is to set up the virtual environment, which will conain
all the packages necessary for the server side of SALMA to run. An IDE like PYCharm will
ask you to set it up automatically, which is the easier option. To do it manually 
follow instructions below.

### For MacOS/Linux
Initialize Environment:
```
python3 -m venv venv
```
Activate Environment:
```
source venv/bin/activate
```
Upgrade Pip, optional:
```
python3 -m pip install --upgrade pip 
```
Install Required Python Packages: 
```
python3 -m pip install -r requirements.txt
```
You need to do this step only once. 

### For Windows:
Initialize environment:
```
python -m venv venv
```
Activate Environment:
```
venv\Scripts\activate.bat
```
Upgrade Pip, optional:
```
python -m pip install --upgrade pip 
```
Install Required Python Packages: 
```
python -m pip install -r requirements.txt
```
You need to do this step only once.

## 2. Starting the frontend

It is recommended that you use yarn to install the packages, because a yarn.lock file is 
included in this repository with the exact versions of the packages. You can install 
yarn globally via npm:
```
npm i -g yarn
```

Navigate to your product folder and run the installation of the packages:
```
yarn install
```
To start the JS frontend use the following script:
```
yarn start:js
```

When running in development please use port 3000, instead of 1234: http://localhost:3000. 

## 3. Starting the backend

In an IDE like PyCharm the best way is to simply debug/execute the index.py file using the buttons on the top right.
Make sure to include the "--develop" argument for development. 

A manual way is to use yarn to start the python backend for windows or mac os respectively:

#### Mac OS:
```
yarn start:py
or
python3 index.py --develop
```
#### Windows:
```
yarn startwin:py
or 
python index.py --develop
```


When not working with PyCharm or an IDE that does it for you, you might to activate the virtual environment first.

#### For MacOS/Linux
```
source .venv/bin/activate
```
#### For Windows
```
.venv\Scripts\activate.bat
```

## Helpful Links

Regarding Virtual Environments:
https://docs.python.org/3/library/venv.html

Regarding PIP packages:
https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/

## Caveats in current setup

### tmp folder
React-Scripts is configured to reload if any member of the public folder changes. However the tmp folder created by 
this framework will write temporary image files there, whenever they are needed. This would normally
reload the applicaiton, which is of course undesirable. To help with this, a script is used that will 
change the webpack config that is provided with react-scripts in your node-modules forlder: rswebpackfix.js.
This script is automatically prepended to the start:js command. So you do not need to deal with it explicitely. 

### eel shutdown on reload
Eel, the underlying framework fro py-js communication will shut down the process whenever all websockets are closed.
This can lead to you having to restart the py server when react is reloaded, which is terribly annoying and doesn't work with
hot reloading very well. To change this behaviour we edit the eel lab's init file, by simply disabling the _detect_shutdown function, like so: 
```
def _detect_shutdown():
    pass;
```
__You have to do this manually after installation!__ 

## Troubleshooting

### 1. The port is already in use and I can't start SALMA

on a Mac do the following:
```
sudo lsof -i tcp:1234
```
To find out which process is using the port. Then you can kill it with:

```
kill -15 PID
or 
kill -9 PID
```
on Windows:

to find the process ID
```
netstat -ano | findstr :3000
```
then replace <PID> with the id to kill the process
```
taskkill /PID <PID> /F
```
### 2. Windows Issues
- On Windows use Python 3.9.11 as there seems to be an issue with visual studio build tools and Python 3.11. It might work on your machine though.
- Install pyinstaller globally before attempting to build the executable: `pip install pyinstaller`

### 3. Multiprocess Issues
- When multiprocess is used "fork" mode will always work but is unsupported for Windows for example. See index.py for a switch that switches between spawn and fork.
This can lead to problems with multiprocessing in libraries that need to be told to use multiprocessing instead of loky or joblib explicitely in this case. This problem only arises in conjunction with pyinstaller, and not during debug. 