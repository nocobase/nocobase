import Topo from '@hapi/topo';
import fg from 'fast-glob';
import path from 'path';
import { PACKAGES_PATH, ROOT_PATH } from '../constant';
import { getPackagesSync } from '@lerna/project';
import { Package } from '@lerna/package';
import { toUnixPath } from './utils';

/**
 * @example
 * yarn build app/client,plugins/acl,core/* => ['app/client', 'plugins/acl', ...all core dir's packages]
 * yarn build app/client plugins/acl core/* => ['app/client', 'plugins/acl', ...all core dir's packages]
 * yarn build => all packages
 */
function getPackagesPath(pkgs: string[]) {
  if (pkgs.length === 0) {
    return fg
      .sync(['*/*/package.json', '*/*/*/package.json'], {
        cwd: PACKAGES_PATH,
        absolute: true,
        onlyFiles: true,
      })
      .map(toUnixPath).map(item => path.dirname(item))
  }
  return fg
    .sync(pkgs, {
      cwd: PACKAGES_PATH,
      absolute: true,
      onlyDirectories: true,
    })
    .map(toUnixPath);
}

export function getPackages(pkgs: string[]) {
  const packagePaths = getPackagesPath(pkgs);

  const packages = getPackagesSync(ROOT_PATH).filter((pkg) => packagePaths.includes(toUnixPath(pkg.location)));

  return sortPackages(packages);
}

// make sure the order of packages is correct
export function sortPackages(packages: Package[]): Package[] {
  const sorter = new Topo.Sorter<Package>();
  for (const pkg of packages) {
    const pkgJson = require(`${pkg.location}/package.json`,);
    const after = Object.keys({ ...pkgJson.dependencies, ...pkgJson.devDependencies, ...pkgJson.peerDependencies });
    sorter.add(pkg, { after, group: pkg.name });
  }

  return sorter.nodes;
}
