import os
from PIL import Image
for img in sorted(os.listdir('assets')):
    path = os.path.join('assets', img)
    with Image.open(path) as im:
        print(img, im.format, im.size, im.mode)
