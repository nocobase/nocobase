import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

function getPackageRoot(packageName: string) {
  let resolved = '';
  try {
    resolved = require.resolve(`${packageName}/package.json`, { paths: [__dirname] });
  } catch (_error) {
    resolved = require.resolve(packageName, { paths: [__dirname] });
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
  const packageJson = require(path.join(source, 'package.json'));
  const target = path.resolve(__dirname, 'dist/node_modules', packageName);

  log(`copying ${packageName} to dist/node_modules`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, {
    recursive: true,
    force: true,
    dereference: false,
    verbatimSymlinks: true,
  });

  const dependencies = Object.keys(packageJson.dependencies || {});
  for (const dependency of dependencies) {
    await copyRuntimePackage(dependency, copied, log);
  }
}

export default defineConfig({
  afterBuild: async (log) => {
    await copyRuntimePackage('quickjs-emscripten', new Set<string>(), log);
  },
});
