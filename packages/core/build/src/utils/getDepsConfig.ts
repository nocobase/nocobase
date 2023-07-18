import path from 'path';
import pkgUp from 'pkg-up';

export function winPath(path: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, '/');
}

/**
 * get relative externals for specific pre-bundle pkg from other pre-bundle deps
 * @note  for example, "compiled/a" can be externalized in "compiled/b" as "../a"
 */
function getRltExternalsFromDeps(
  depExternals: Record<string, string>,
  current: { name: string; output: string },
) {
  return Object.entries(depExternals).reduce<Record<string, string>>(
    (r, [dep, target]) => {
      // skip self
      if (dep !== current.name) {
        // transform dep externals path to relative path
        r[dep] = winPath(
          path.relative(path.dirname(current.output), path.dirname(target)),
        );
      }

      return r;
    },
    {},
  );
}

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

interface IDepPkg {
  nccConfig: {
    minify: boolean;
    target: string;
    quiet: boolean;
    externals: Record<string, string>;
  };
  pkg: Record<string, any>;
  output: string;
}

export function getDepsConfig(cwd: string, outDir: string, depsName: string[], external: string[]) {
  const pkgExternals: Record<string, string> = external.reduce((r, dep) => ({ ...r, [dep]: dep }), {});

  const depExternals = {};
  const deps = depsName.reduce<Record<string, IDepPkg>>((acc, packageName) => {
    const depEntryPath = require.resolve(packageName, { paths: [cwd] });
    const depPkgPath = getDepPkgPath(packageName, cwd);
    const depPkg = require(depPkgPath);
    acc[depEntryPath] = {
      nccConfig: {
        minify: true,
        target: 'es5',
        quiet: true,
        externals: {},
      },
      pkg: depPkg,
      output: path.join(outDir, packageName, 'index.js'),
    }

    return acc;
  }, {})

  // process externals for deps
  Object.values(deps).forEach((depConfig) => {
    const rltDepExternals = getRltExternalsFromDeps(depExternals, {
      name: depConfig.pkg.name!,
      output: depConfig.output,
    });

    depConfig.nccConfig.externals

    depConfig.nccConfig.externals = {
      ...pkgExternals,
      ...rltDepExternals,
    };
  });

  return deps;
}
