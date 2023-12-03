import Topo from '@hapi/topo';
import fg from 'fast-glob';
import path from 'path';
import { PACKAGES_PATH, ROOT_PATH } from '../constant';
import { getPackagesSync } from '@lerna/project';
import { Package } from '@lerna/package';
import { toUnixPath } from './utils';

/**
 * 获取构建包的绝对路径，支持项目路径和 npm 两种形式
 * @example
 * yarn build packages/core/client @nocobase/acl => ['/home/xx/packages/core/client', '/home/xx/packages/core/acl']
 * yarn build => all packages
 */
function getPackagesPath(pkgs: string[]) {
  const allPackageJson = fg
    .sync(['*/*/package.json', '*/*/*/package.json'], {
      cwd: PACKAGES_PATH,
      absolute: true,
      onlyFiles: true,
    });

  if (pkgs.length === 0) {
    return allPackageJson
      .map(toUnixPath).map(item => path.dirname(item));
  }

  const allPackageInfo = allPackageJson
    .map(packageJsonPath => ({ name: require(packageJsonPath).name, path: path.dirname(toUnixPath(packageJsonPath)) }))
    .reduce((acc, cur) => {
      acc[cur.name] = cur.path;
      return acc;
    }, {});
  const allPackagePaths: string[] = Object.values(allPackageInfo);

  const pkgNames = pkgs.filter(item => allPackageInfo[item]);
  const relativePaths = pkgNames.length ? pkgs.filter(item => !pkgNames.includes(item)) : pkgs;
  const pkgPaths = pkgs.map(item => allPackageInfo[item])
  const absPaths = allPackagePaths.filter(absPath => relativePaths.some((relativePath) => absPath.endsWith(relativePath)));
  return [...pkgPaths, ...absPaths];
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
