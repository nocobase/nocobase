"""Exclude dependency editor caches from the CLI deployment archive."""
from pathlib import Path
import tarfile
import shutil

root = Path(__file__).resolve().parent.parent
source = root / 'storage/exports/dist.tar.gz'
target = root / 'storage/exports/equipment-preview.tar.gz'
lock = root / 'verification/production-lock.yaml'
lock.parent.mkdir(exist_ok=True)
shutil.copy2(root / 'dist/node_modules/.pnpm/lock.yaml', lock)
with tarfile.open(source, 'r:gz') as original, tarfile.open(target, 'w:gz') as output:
    for entry in original:
        if '/.vs/' in entry.name or entry.name.endswith('/.vs'):
            continue
        output.addfile(entry, original.extractfile(entry) if entry.isfile() else None)
    output.add(lock, arcname='dist/pnpm-lock.yaml')
print(target)
