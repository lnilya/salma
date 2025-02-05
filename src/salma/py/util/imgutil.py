import os
from typing import Tuple

import numpy as np

from src.salma.py import settings
from src.salma.py import eelutil
from PIL import Image
import os
from typing import Tuple

import numpy as np
from PIL import Image

from src.salma.py import eelutil
from src.salma.py import settings


#plotly import

# Will convert a grayscale float [0-1] image into an RGB image with the given colormap. See

def norm(img: np.ndarray, range: Tuple = (0, 1), newtype=None):
    img = (img - img.min()) / (img.max() - img.min())
    img = (img + range[0]) * (range[1] - range[0])
    if newtype is not None:
        img = img.astype(newtype)

    return img

# Will retrieve the JS preview image url for a given array and key.
# will not resave if force is set to false and the preview image is already available.
def getPreviewImage(img: np.ndarray, key: str, force: bool = True):
    relPath = os.path.join(settings.TMP_FOLDER, key + '.jpg')
    absPath = eelutil.getFilePath(relPath)

    if not os.path.exists(absPath) or force:
        #save imge
        if img.dtype != np.uint8:
            img = (img * 255).astype(np.uint8)
        Image.fromarray(img).save(absPath)

    return {
        'url': eelutil.getFileURL(relPath, force),
        'w': img.shape[1],
        'h': img.shape[0]
    }





def getPlotRowsColsForNumObj(obj: int, colsVsRows: int = 2):
    r = c = 1
    incR = colsVsRows
    # increase c colsVsRows times more often than r, so that the ratio tilts towards more columns than rows.
    while r * c < obj:
        if incR > 0:
            c += 1
            incR -= 1
        else:
            r += 1
            incR = colsVsRows

    return r, c


def addBorder(img:np.ndarray,b,val = 0):
    bimg = np.ones((img.shape[0]+b*2,img.shape[1]+b*2),dtype=img.dtype) * val
    bimg[b:-b,b:-b] = img
    return bimg