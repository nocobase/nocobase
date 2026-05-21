import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

function getPackageRoot(packageName: string) {
  let resolved = '';
  try {
    resolved = require.resolve(`${packageName}/package.json`);
  } catch (_error) {
    resolved = require.resolve(packageName);
  }
  const marker = `${path.sep}node_modules${path.sep}${packageName.split('/').join(path.sep)}${path.sep}`;
  const markerIndex = resolved.lastIndexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Cannot resolve package root for ${packageName} from ${resolved}`);
  }
  return resolved.slice(0, markerIndex + marker.length - 1);
}

async function copyRuntimePackage(packageName: string, copied: Set<string>, log: (msg: string) => void) {
  if (copied.has(packageName)) {
    return;
  }
  copied.add(packageName);

  const source = getPackageRoot(packageName);
  const target = path.resolve(__dirname, 'dist/node_modules', packageName);
  log(`copying ${packageName} to dist/node_modules`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, {
    recursive: true,
    force: true,
    dereference: false,
    verbatimSymlinks: true,
  });
}

export default defineConfig({
  afterBuild: async (log) => {
    const copied = new Set<string>();
    const packagesToCopy = ['oidc-provider', 'jose', 'quick-lru', 'eta', 'statuses', 'undici'];
    for (const packageName of packagesToCopy) {
      await copyRuntimePackage(packageName, copied, log);
    }
  },
});
