import execa from 'execa';
import chalk from 'chalk';
import {
  PACKAGES_PATH,
  getPluginPackages,
  CORE_CLIENT,
  APP_CLIENT,
  APP_SERVER,
  getCjsPackages,
  ROOT_PATH,
  getPresetsPackages,
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

  // app/server
  const appServer = packages.find((item) => item.location === APP_SERVER);
  if (appServer) {
    await buildPackage(appServer, 'dist', buildCjs);
  }

  // app/client
  const appClient = packages.find((item) => item.location === APP_CLIENT);
  if (appClient) {
    await selfControlBuild(appClient, APP_CLIENT);
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

export async function selfControlBuild(pkg: Package, cwd: string) {
  const log = getPkgLog(pkg.name);

  log('build start');

  await runScript(['build'], cwd);
}

function runScript(args: string[], cwd: string) {
  return execa('yarn', args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
}
