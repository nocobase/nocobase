import pkgUp from 'pkg-up';

/**
 * get package.json path for specific NPM package
 */
export function getDepPkgPath(dep: string, cwd: string) {
  try {
    return require.resolve(`${dep}/package.json`, { paths: [cwd] });
  } catch {
    return pkgUp.sync({
      cwd: require.resolve(dep, { paths: [cwd] }),
    })!;
  }
}

export function getDepsConfig(cwd: string, dependenciesName: string[]) {
  return dependenciesName.reduce<Record<string, string>>((acc, packageName) => {
    const depPkgPath = getDepPkgPath(packageName, cwd);
    const depPkg = require(depPkgPath);
    acc[packageName] = depPkg.version;
    return acc;
  }, {})
}
