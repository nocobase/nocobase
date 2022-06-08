import * as assert from 'assert';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { merge } from 'lodash';
import { isAbsolute, join, sep } from 'path';
import rimraf from 'rimraf';
import signale from 'signale';
import babel from './babel';
import getUserConfig, { CONFIG_FILES } from './getUserConfig';
import randomColor from './randomColor';
import registerBabel from './registerBabel';
import rollup from './rollup';
import { Dispose, IBundleOptions, IBundleTypeOutput, ICjs, IEsm, IOpts } from './types';
import { getExistFile, getLernaPackages } from './utils';

export function getBundleOpts(opts: IOpts): IBundleOptions[] {
  const { cwd, buildArgs = {}, rootConfig = {} } = opts;
  const entry = getExistFile({
    cwd,
    files: ['src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js'],
    returnRelative: true,
  });
  const userConfig = getUserConfig({ cwd, customPath: buildArgs.config });
  const userConfigs = Array.isArray(userConfig) ? userConfig : [userConfig];
  return (userConfigs as any).map((userConfig) => {
    const bundleOpts = merge(
      {
        entry,
      },
      rootConfig,
      userConfig,
      buildArgs
    );

    // Support config esm: 'rollup' and cjs: 'rollup'
    if (typeof bundleOpts.esm === 'string') {
      bundleOpts.esm = { type: bundleOpts.esm };
    }
    if (typeof bundleOpts.cjs === 'string') {
      bundleOpts.cjs = { type: bundleOpts.cjs };
    }

    return bundleOpts;
  });
}

function validateBundleOpts(bundleOpts: IBundleOptions, { cwd, rootPath }) {
  if (bundleOpts.runtimeHelpers) {
    const pkgPath = join(cwd, 'package.json');
    assert.ok(existsSync(pkgPath), `@babel/runtime dependency is required to use runtimeHelpers`);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    assert.ok(
      (pkg.dependencies || {})['@babel/runtime'],
      `@babel/runtime dependency is required to use runtimeHelpers`
    );
  }
  if (
    bundleOpts.cjs &&
    (bundleOpts.cjs as ICjs).lazy &&
    (bundleOpts.cjs as ICjs).type === 'rollup'
  ) {
    throw new Error(
      `
cjs.lazy don't support rollup.
    `.trim()
    );
  }
  if (!bundleOpts.esm && !bundleOpts.cjs && !bundleOpts.umd) {
    throw new Error(
      `
None format of ${chalk.cyan(
        'cjs | esm | umd'
      )} is configured, checkout https://github.com/umijs/father for usage details.
`.trim()
    );
  }
  if (bundleOpts.entry) {
    const tsConfigPath = join(cwd, 'tsconfig.json');
    const tsConfig =
      existsSync(tsConfigPath) || (rootPath && existsSync(join(rootPath, 'tsconfig.json')));
    if (
      !tsConfig &&
      ((Array.isArray(bundleOpts.entry) && bundleOpts.entry.some(isTypescriptFile)) ||
        (!Array.isArray(bundleOpts.entry) && isTypescriptFile(bundleOpts.entry)))
    ) {
      signale.info(
        `Project using ${chalk.cyan(
          'typescript'
        )} but tsconfig.json not exists. Use default config.`
      );
    }
  }
}

function isTypescriptFile(filePath) {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

interface IExtraBuildOpts {
  pkg?: string | { name?: string };
}

export async function build(opts: IOpts, extraOpts: IExtraBuildOpts = {}) {
  const { cwd, rootPath, watch, buildArgs = {}, clean = true } = opts;
  const { pkg } = extraOpts;

  const dispose: Dispose[] = [];

  const customConfigPath =
    buildArgs.config &&
    (isAbsolute(buildArgs.config) ? buildArgs.config : join(process.cwd(), buildArgs.config));

  // register babel for config files
  registerBabel({
    cwd,
    only: customConfigPath ? CONFIG_FILES.concat(customConfigPath) : CONFIG_FILES,
  });

  const pkgName = (typeof pkg === 'string' ? pkg : pkg?.name) || 'unknown';

  function log(msg) {
    console.log(`${pkg ? `${randomColor(`${pkgName}`)}: ` : ''}${msg}`);
  }

  // Get user config
  const bundleOptsArray = getBundleOpts(opts);

  for (const bundleOpts of bundleOptsArray) {
    validateBundleOpts(bundleOpts, { cwd, rootPath });

    // Clean dist
    if (clean) {
      log(chalk.gray(`Clean dist directory`));
      rimraf.sync(join(cwd, 'dist'));
    }


    // Build umd
    if (bundleOpts.umd) {
      log(`Build umd`);
      await rollup({
        cwd,
        rootPath,
        log,
        type: 'umd',
        entry: bundleOpts.entry,
        watch,
        dispose,
        bundleOpts,
      });
    }

    // Build cjs
    if (bundleOpts.cjs) {
      const cjs = bundleOpts.cjs as IBundleTypeOutput;
      log(`Build cjs with ${cjs.type}`);
      if (cjs.type === 'babel') {
        await babel({ cwd, rootPath, watch, dispose, type: 'cjs', log, bundleOpts });
      } else {
        await rollup({
          cwd,
          rootPath,
          log,
          type: 'cjs',
          entry: bundleOpts.entry,
          watch,
          dispose,
          bundleOpts,
        });
      }
    }

    // Build esm
    if (bundleOpts.esm) {
      const esm = bundleOpts.esm as IEsm;
      log(`Build esm with ${esm.type}`);
      const importLibToEs = esm && esm.importLibToEs;
      if (esm && esm.type === 'babel') {
        await babel({ cwd, rootPath, watch, dispose, type: 'esm', importLibToEs, log, bundleOpts });
      } else {
        await rollup({
          cwd,
          rootPath,
          log,
          type: 'esm',
          entry: bundleOpts.entry,
          importLibToEs,
          watch,
          dispose,
          bundleOpts,
        });
      }
    }
  }

  return dispose;
}

function getPkgRelativePath(cwd, pkg) {
  const basePath = cwd.split(sep).join('/') + '/packages/';
  const dir = pkg.contents.split(sep).join('/');
  return dir.substring(basePath.length);
}

export async function buildForLerna(opts: IOpts) {
  const { cwd, rootConfig = {}, buildArgs = {}, packages = [] } = opts;

  // register babel for config files
  registerBabel({
    cwd,
    only: CONFIG_FILES,
  });

  const userConfig = merge(getUserConfig({ cwd }), rootConfig, buildArgs);

  let pkgs = await getLernaPackages(cwd, userConfig.pkgFilter);
  // support define pkgs in lerna
  if (userConfig.pkgs) {
    pkgs = pkgs.filter(pkg => userConfig.pkgs.includes(getPkgRelativePath(cwd, pkg)));
  }
  const dispose: Dispose[] = [];
  for (const pkg of pkgs) {
    const pkgName = getPkgRelativePath(cwd, pkg);
    if (userConfig.excludePkgs && userConfig.excludePkgs.includes(pkgName)) {
      continue;
    }
    if (packages.length && !packages.includes(pkgName)) continue;
    // build error when .DS_Store includes in packages root
    const pkgPath = pkg.contents;
    assert.ok(
      existsSync(join(pkgPath, 'package.json')),
      `package.json not found in packages/${pkg}`
    );
    process.chdir(pkgPath);
    dispose.push(
      ...(await build(
        {
          // eslint-disable-line
          ...opts,
          buildArgs: opts.buildArgs,
          rootConfig: userConfig,
          cwd: pkgPath,
          rootPath: cwd,
        },
        {
          pkg,
        }
      ))
    );
  }
  return dispose;
}

export default async function (opts: IOpts) {
  const useLerna = existsSync(join(opts.cwd, 'lerna.json'));
  const isLerna = useLerna && process.env.LERNA !== 'none';

  const dispose = isLerna ? await buildForLerna(opts) : await build(opts);
  return () => dispose.forEach((e) => e());
}
