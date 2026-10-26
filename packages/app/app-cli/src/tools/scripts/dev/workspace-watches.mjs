import fs from 'node:fs';
import path from 'node:path';

import { listWorkspacePackages } from '../utils/workspace-packages.mjs';

/** Watch the application's internal packages, including dependencies reached through another workspace package. */
export function resolveWorkspaceWatchIncludes(rootDir) {
  if (!fs.existsSync(path.join(rootDir, 'packages'))) return [];
  const packages = listWorkspacePackages(rootDir);
  const visited = new Set([path.resolve(rootDir)]);
  const includes = [];
  const visit = (directory, isApplication = false) => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
    );
    const dependencies = {
      ...(isApplication ? manifest.devDependencies : {}),
      ...manifest.peerDependencies,
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    for (const [name, version] of Object.entries(dependencies)) {
      if (!version.startsWith('workspace:')) continue;
      const dependencyDir = packages.get(name);
      if (!dependencyDir || visited.has(dependencyDir)) continue;
      visited.add(dependencyDir);
      const relative = path
        .relative(rootDir, dependencyDir)
        .split(path.sep)
        .join('/');
      if (relative.startsWith('packages/')) {
        includes.push(
          `${relative}/package.json`,
          `${relative}/src/**/*`,
          `${relative}/dist/**/*`,
          `${relative}/server/**/*`,
          `${relative}/database/**/*`,
          `${relative}/shared/**/*`,
        );
      }
      visit(dependencyDir);
    }
  };
  visit(rootDir, true);
  return includes;
}
