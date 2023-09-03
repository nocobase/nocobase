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
} from './constant';
import { buildClient } from './buildClient';
import { buildCjs } from './buildCjs';
import { buildPlugin } from './buildPlugin';
import { buildDeclaration } from './buildDeclaration';
import { PkgLog, getPkgLog, toUnixPath, getPackageJson } from './utils';
import { getPackages } from './utils/getPackages';
import { Package } from '@lerna/package';

export async function build(pkgs: string[]) {
  const packages = getPackages(pkgs);
  const pluginPackages = getPluginPackages(packages);
  const cjsPackages = getCjsPackages(packages);
  const presetsPackages = getPresetsPackages(packages);

  // core/*
  await buildPackages(cjsPackages, 'lib', buildCjs);
  const clientCore = packages.find((item) => item.location === CORE_CLIENT);
  if (clientCore) {
    await buildPackage(clientCore, 'es', buildClient);
  }

  // plugins/*、samples/*
  await buildPackages(pluginPackages, 'dist', buildPlugin);

  // presets/*
  await buildPackages(presetsPackages, 'lib', buildCjs);

  // core/app
  const appClient = packages.find((item) => item.location === CORE_APP);
  if (appClient) {
    await runScript(['umi', 'build'], ROOT_PATH, {
      APP_ROOT: path.join(CORE_APP, 'client'),
    });
  }
}

export async function buildPackages(
  packages: Package[],
  targetDir: string,
  doBuildPackage: (cwd: string, sourcemap: boolean, log?: PkgLog) => Promise<any>,
) {
  for await (const pkg of packages) {
    await buildPackage(pkg, targetDir, doBuildPackage);
  }
}

export async function buildPackage(
  pkg: Package,
  targetDir: string,
  doBuildPackage: (cwd: string, sourcemap: boolean, log?: PkgLog) => Promise<any>,
) {
  const sourcemap = process.argv.includes('--sourcemap');
  const noDeclaration = process.argv.includes('--no-dts');
  const log = getPkgLog(pkg.name);
  const packageJson = getPackageJson(pkg.location);
  log(`${chalk.bold(toUnixPath(pkg.location.replace(PACKAGES_PATH, '').slice(1)))} build start`);

  // prebuild
  if (packageJson?.scripts?.prebuild) {
    log('prebuild');
    await runScript(['prebuild'], pkg.location);
    await packageJson.prebuild(pkg.location);
  }

  // build source
  await doBuildPackage(pkg.location, sourcemap, log);

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
}

function runScript(args: string[], cwd: string, envs: Record<string, string> = {}) {
  return execa('yarn', args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envs,
      NODE_ENV: 'production',
    },
  });
}
