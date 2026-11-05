import urllib.request
import zipfile
import pathlib
import shutil

root = pathlib.Path(r'F:\honey')
zip_path = root / 'node.zip'
node_tmp = root / 'node_tmp'
node_dir = root / 'node'

print('Removing existing node directories if present...')
if node_dir.exists():
    shutil.rmtree(node_dir)
if node_tmp.exists():
    shutil.rmtree(node_tmp)
if zip_path.exists():
    zip_path.unlink()

print('Downloading Node.js...')
urllib.request.urlretrieve('https://nodejs.org/dist/v20.16.0/node-v20.16.0-win-x64.zip', zip_path)
print(f'Download complete: {zip_path} ({zip_path.stat().st_size} bytes)')

print('Extracting archive...')
with zipfile.ZipFile(zip_path, 'r') as z:
    z.extractall(node_tmp)
print('Extraction complete')

print('Moving extracted files...')
node_dir.mkdir(exist_ok=True)
for item in node_tmp.iterdir():
    target = node_dir / item.name
    if target.exists():
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
    shutil.move(str(item), str(node_dir))

print('Cleaning up temporary files...')
shutil.rmtree(node_tmp)
zip_path.unlink()
print('Node installation complete')
print('Node path contents:', [p.name for p in node_dir.iterdir()])
