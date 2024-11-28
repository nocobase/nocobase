/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import execa from 'execa';
import chalk from 'chalk';
import path from 'path';
import {
  PACKAGES_PATH,
  getPluginPackages,
  CORE_CLIENT,
  CORE_APP,
  getCjsPackages,
  getPresetsPackages,
  ROOT_PATH,
  ESM_PACKAGES,
} from './constant';
import { buildClient } from './buildClient';
import { buildCjs } from './buildCjs';
import { buildPlugin } from './buildPlugin';
import { buildDeclaration } from './buildDeclaration';
import {
  PkgLog,
  getPkgLog,
  toUnixPath,
  getPackageJson,
  getUserConfig,
  UserConfig,
  writeToCache,
  readFromCache,
} from './utils';
import { getPackages } from './utils/getPackages';
import { Package } from '@lerna/package';
import { tarPlugin } from './tarPlugin';
import { buildEsm } from './buildEsm';
import { addLicense } from './utils/addlicense';

const BUILD_ERROR = 'build-error';

export async function build(pkgs: string[]) {
  const isDev = process.argv.includes('--development');
  process.env.NODE_ENV = isDev ? 'development' : 'production';

  let packages = getPackages(pkgs);
  const cachePkg = readFromCache(BUILD_ERROR);
  if (process.argv.includes('--retry') && cachePkg?.pkg) {
    packages = packages.slice(packages.findIndex((item) => item.name === cachePkg.pkg));
  }
  if (packages.length === 0) {
    let msg = '';
    if (pkgs.length) {
      msg = `'${pkgs.join(', ')}' did not match any packages`;
    } else {
      msg = 'No package matched';
    }
    console.warn(chalk.yellow(`[@nocobase/build]: ${msg}`));
    return;
  }

  const pluginPackages = getPluginPackages(packages);
  const cjsPackages = getCjsPackages(packages);
  const presetsPackages = getPresetsPackages(packages);

  // core/*
  await buildPackages(cjsPackages, 'lib', buildCjs);
  const clientCore = packages.find((item) => item.location === CORE_CLIENT);
  if (clientCore) {
    await buildPackage(clientCore, 'es', buildClient);
  }
  const esmPackages = packages.filter((pkg) => ESM_PACKAGES.includes(pkg.name));
  await buildPackages(esmPackages, 'lib', buildCjs);
  await buildPackages(esmPackages, 'es', buildEsm);

  // plugins/*、samples/*
  await buildPackages(pluginPackages, 'dist', buildPlugin);

  // presets/*
  await buildPackages(presetsPackages, 'lib', buildCjs);

  // core/app
  const appClient = packages.find((item) => item.location === CORE_APP);
  if (appClient) {
    await runScript(['umi', 'build'], ROOT_PATH, {
      APP_ROOT: path.join(CORE_APP, 'client'),
      ANALYZE: process.env.BUILD_ANALYZE === 'true' ? '1' : undefined,
    });
  }
  writeToCache(BUILD_ERROR, {});
}

export async function buildPackages(
  packages: Package[],
  targetDir: string,
  doBuildPackage: (cwd: string, userConfig: UserConfig, sourcemap: boolean, log?: PkgLog) => Promise<any>,
) {
  for await (const pkg of packages) {
    writeToCache(BUILD_ERROR, { pkg: pkg.name });
    await buildPackage(pkg, targetDir, doBuildPackage);
  }
}

export async function buildPackage(
  pkg: Package,
  targetDir: string,
  doBuildPackage: (cwd: string, userConfig: UserConfig, sourcemap: boolean, log?: PkgLog) => Promise<any>,
) {
  const sourcemap = process.argv.includes('--sourcemap');
  const noDeclaration = process.argv.includes('--no-dts');
  const hasTar = process.argv.includes('--tar');
  const onlyTar = process.argv.includes('--only-tar');

  const log = getPkgLog(pkg.name);
  const packageJson = getPackageJson(pkg.location);

  if (onlyTar) {
    await tarPlugin(pkg.location, log);
    return;
  }

  log(`${chalk.bold(toUnixPath(pkg.location.replace(PACKAGES_PATH, '').slice(1)))} build start`);

  const userConfig = getUserConfig(pkg.location);
  // prebuild
  if (packageJson?.scripts?.prebuild) {
    log('prebuild');
    await runScript(['prebuild'], pkg.location);
    await packageJson.prebuild(pkg.location);
  }
  if (userConfig.beforeBuild) {
    log('beforeBuild');
    await userConfig.beforeBuild(log);
  }

  // build source
  await doBuildPackage(pkg.location, userConfig, sourcemap, log);

  // build declaration
  if (!noDeclaration) {
    log('build declaration');
    await buildDeclaration(pkg.location, targetDir);
  }

  // postbuild
  if (packageJson?.scripts?.postbuild) {
    log('postbuild');
    await runScript(['postbuild'], pkg.location);
  }

  if (userConfig.afterBuild) {
    log('afterBuild');
    await userConfig.afterBuild(log);
  }

  await addLicense(path.join(pkg.location, targetDir), log);

  // tar
  if (hasTar) {
    await tarPlugin(pkg.location, log);
  }
}

function runScript(args: string[], cwd: string, envs: Record<string, string> = {}) {
  return execa('yarn', args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envs,
      sourcemap: process.argv.includes('--sourcemap') ? 'sourcemap' : undefined,
      NODE_ENV: process.env.NODE_ENV || 'production',
    },
  });
}
