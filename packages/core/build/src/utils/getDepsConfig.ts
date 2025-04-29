/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

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
export function getRltExternalsFromDeps(
  depExternals: Record<string, string>,
  current: { name: string; outputDir: string },
) {
  return Object.entries(depExternals).reduce<Record<string, string>>(
    (r, [dep, target]) => {
      // skip self
      if (dep !== current.name) {
        // transform dep externals path to relative path
        r[dep] = winPath(
          path.relative(current.outputDir, path.dirname(target)),
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
    const mainFile = require.resolve(`${dep}`, { paths: cwd ? [cwd] : undefined });
    const packageDir = mainFile.slice(0, mainFile.indexOf(dep.replace('/', path.sep)) + dep.length);
    return path.join(packageDir, 'package.json');
  }
}

interface IDepPkg {
  nccConfig: {
    minify: boolean;
    target: string;
    quiet: boolean;
    externals: Record<string, string>;
  };
  depDir: string;
  pkg: Record<string, any>;
  outputDir: string;
  mainFile: string;
}

export function getDepsConfig(cwd: string, outDir: string, depsName: string[], external: string[]) {
  const pkgExternals: Record<string, string> = external.reduce((r, dep) => ({ ...r, [dep]: dep }), {});

  const depExternals = {};
  const deps = depsName.reduce<Record<string, IDepPkg>>((acc, packageName) => {
    const depEntryPath = require.resolve(packageName, { paths: [cwd] });
    const depPkgPath = getDepPkgPath(packageName, cwd);
    const depPkg = require(depPkgPath);
    const depDir = path.dirname(depPkgPath);
    const outputDir = path.join(outDir, packageName);
    const mainFile = path.join(outputDir, depEntryPath.replace(depDir, ''));
    acc[depEntryPath] = {
      nccConfig: {
        minify: true,
        target: 'es5',
        quiet: true,
        externals: {},
      },
      depDir,
      pkg: depPkg,
      outputDir,
      mainFile,
    }

    return acc;
  }, {})

  // process externals for deps
  Object.values(deps).forEach((depConfig) => {
    const rltDepExternals = getRltExternalsFromDeps(depExternals, {
      name: depConfig.pkg.name!,
      outputDir: depConfig.outputDir,
    });

    depConfig.nccConfig.externals = {
      ...pkgExternals,
      ...rltDepExternals,
    };
  });

  return deps;
}
