import zipfile
import os

path = r'C:\Users\jarry\Downloads\uipath_insider_guest_pitch.pptx'
if not os.path.exists(path):
    raise FileNotFoundError(path)

with zipfile.ZipFile(path, 'r') as z:
    images = [name for name in z.namelist() if name.startswith('ppt/media/')]
    os.makedirs('assets', exist_ok=True)
    for img in images:
        dest = os.path.join('assets', os.path.basename(img))
        with open(dest, 'wb') as out:
            out.write(z.read(img))
        print('wrote', dest)
