import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const relativeAssets = ['client/workflow-management/workflow-canvas.css'];

for (const relativeAsset of relativeAssets) {
  const destination = path.join(packageRoot, 'dist', relativeAsset);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(packageRoot, relativeAsset), destination);
}
