import fs from 'node:fs';
import path from 'node:path';

import { listWorkspacePackages } from './workspace-packages.mjs';

/** Build the application's packages, without following its dependencies' test fixtures. */
export function resolveBuildWorkspacePackages(rootDir) {
  const packages = listWorkspacePackages(rootDir);
  const visited = new Set([path.resolve(rootDir)]);
  const selected = [];
  const visit = (directory, application = false) => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
    );
    const dependencies = {
      ...(application ? manifest.devDependencies : {}),
      ...manifest.peerDependencies,
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    for (const name of Object.keys(dependencies)) {
      const dependency = packages.get(name);
      if (!dependency || visited.has(dependency)) continue;
      visited.add(dependency);
      selected.push(name);
      visit(dependency);
    }
  };
  visit(rootDir, true);
  return selected.sort();
}

/** Keep explicit heap settings and unrelated Node options when supplying the build default. */
export function buildNodeOptions(options = '') {
  return /--max[-_]old[-_]space[-_]size(?:=|\s)/.test(options)
    ? options
    : `${options} --max-old-space-size=6144`.trim();
}
