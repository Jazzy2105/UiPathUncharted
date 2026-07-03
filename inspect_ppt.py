import zipfile
import os
import xml.etree.ElementTree as ET

path = r'C:\Users\jarry\Downloads\uipath_insider_guest_pitch.pptx'
if not os.path.exists(path):
    raise FileNotFoundError(path)

with zipfile.ZipFile(path, 'r') as z:
    slides = [name for name in z.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
    print('slides', len(slides))
    ns = {
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'
    }
    for slide in slides:
        xml = z.read(slide)
        root = ET.fromstring(xml)
        texts = [t.text for t in root.findall('.//a:t', ns) if t.text and t.text.strip()]
        print('\n---', slide)
        for line in texts:
            print(line.strip())
    print('\nimages:')
    imgs = sorted([name for name in z.namelist() if name.startswith('ppt/media/')])
    for img in imgs:
        print(img)
