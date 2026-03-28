/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Package } from '@lerna/package';
import chalk from 'chalk';
import path from 'path';
import { buildCjs } from './buildCjs';
import { buildClient } from './buildClient';
import { buildDeclaration } from './buildDeclaration';
import { buildEsm } from './buildEsm';
import { buildPlugin } from './buildPlugin';
import {
  CORE_APP,
  CORE_CLIENT,
  ESM_PACKAGES,
  getCjsPackages,
  getPluginPackages,
  getPresetsPackages,
  PACKAGES_PATH,
  ROOT_PATH,
} from './constant';
import { tarPlugin } from './tarPlugin';
import {
  BuildProfileCollector,
  createBuildProfileCollector,
  formatDuration,
  getPackageJson,
  getPkgLog,
  getUserConfig,
  nowMs,
  PkgLog,
  printBuildProfile,
  readFromCache,
  runProfiledStage,
  runScript,
  runWithConcurrency,
  PackageProfile,
  toUnixPath,
  UserConfig,
  writeToCache,
} from './utils';
import { addLicense } from './utils/addlicense';
import { getPackages, groupPackagesByTopoLevel } from './utils/getPackages';

const BUILD_ERROR = 'build-error';
const DEFAULT_LAYER_CONCURRENCY = 2;
const DEFAULT_PLUGIN_LAYER_CONCURRENCY = 1;
const ENABLE_BUILD_PROFILE = process.env.BUILD_PROFILE === 'true';

export async function build(pkgs: string[]) {
  const profile = ENABLE_BUILD_PROFILE ? createBuildProfileCollector() : null;
  const buildStart = nowMs();
  const isDev = process.argv.includes('--development');
  process.env.NODE_ENV = isDev ? 'development' : 'production';

  try {
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
    await buildPackages(cjsPackages, 'lib', buildCjs, {
      sourceConcurrency: DEFAULT_LAYER_CONCURRENCY,
      declarationConcurrency: 1,
      stageName: 'core cjs',
      profile,
    });
    const clientCore = packages.find((item) => item.location === CORE_CLIENT);
    if (clientCore) {
      await buildSinglePackage(clientCore, 'es', buildClient, {
        stageName: 'core client',
        profile,
      });
    }
    const esmPackages = packages.filter((pkg) => ESM_PACKAGES.includes(pkg.name));
    await buildPackages(esmPackages, 'lib', buildCjs, {
      sourceConcurrency: DEFAULT_LAYER_CONCURRENCY,
      declarationConcurrency: 1,
      stageName: 'esm cjs',
      profile,
    });
    await buildPackages(esmPackages, 'es', buildEsm, {
      sourceConcurrency: DEFAULT_LAYER_CONCURRENCY,
      declarationConcurrency: 1,
      stageName: 'esm',
      profile,
    });

    // plugins/*、samples/*
    await buildPackages(pluginPackages, 'dist', buildPlugin, {
      sourceConcurrency: DEFAULT_PLUGIN_LAYER_CONCURRENCY,
      declarationConcurrency: 1,
      stageName: 'plugins',
      profile,
    });

    // presets/*
    await buildPackages(presetsPackages, 'lib', buildCjs, {
      sourceConcurrency: DEFAULT_LAYER_CONCURRENCY,
      declarationConcurrency: 1,
      stageName: 'presets',
      profile,
    });

    // core/app
    const appClient = packages.find((item) => item.location === CORE_APP);
    if (appClient) {
      await runProfiledStage(profile, 'app shell', async () => {
        await runScript(['rsbuild', 'build', '--config', path.join(CORE_APP, 'client', 'rsbuild.config.ts')], ROOT_PATH, {
          APP_ROOT: path.join(CORE_APP, 'client'),
          ANALYZE: process.env.BUILD_ANALYZE === 'true' ? '1' : undefined,
        });
      });
    }
    writeToCache(BUILD_ERROR, {});
  } finally {
    if (profile) {
      printBuildProfile(profile, nowMs() - buildStart);
    }
  }
}

export async function buildPackages(
  packages: Package[],
  targetDir: string,
  doBuildPackage: (cwd: string, userConfig: UserConfig, sourcemap: boolean, log?: PkgLog) => Promise<any>,
  options: {
    sourceConcurrency?: number;
    declarationConcurrency?: number;
    stageName?: string;
    profile?: BuildProfileCollector | null;
  } = {},
) {
  const {
    sourceConcurrency = DEFAULT_LAYER_CONCURRENCY,
    declarationConcurrency = 1,
    stageName = 'packages',
    profile = null,
  } = options;
  const layers = groupPackagesByTopoLevel(packages);
  const shouldRunDeclaration = !process.argv.includes('--no-dts') && !process.argv.includes('--only-tar');

  await runProfiledStage(profile, `${stageName} source`, async () => {
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      console.log(chalk.cyan(`[@nocobase/build]: ${stageName} source layer ${index + 1}/${layers.length} (${layer.length} packages)`));
      const layerStart = nowMs();
      await runWithConcurrency(layer, sourceConcurrency, async (pkg) => {
        await buildPackageSourceLifecycle(pkg, targetDir, doBuildPackage, profile);
      });
      const layerDurationMs = nowMs() - layerStart;
      if (profile) {
        profile.layers.push({
          stageName: `${stageName} source`,
          layerIndex: index + 1,
          layerCount: layers.length,
          packageCount: layer.length,
          durationMs: layerDurationMs,
        });
      }
      if (ENABLE_BUILD_PROFILE) {
        console.log(chalk.gray(`[@nocobase/build]: ${stageName} source layer ${index + 1}/${layers.length} finished in ${formatDuration(layerDurationMs)}`));
      }
    }
  });

  if (!shouldRunDeclaration) {
    return;
  }

  await runProfiledStage(profile, `${stageName} declaration`, async () => {
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      console.log(chalk.cyan(`[@nocobase/build]: ${stageName} declaration layer ${index + 1}/${layers.length} (${layer.length} packages)`));
      const layerStart = nowMs();
      await runWithConcurrency(layer, declarationConcurrency, async (pkg) => {
        await buildPackageDeclarationLifecycle(pkg, targetDir, profile);
      });
      const layerDurationMs = nowMs() - layerStart;
      if (profile) {
        profile.layers.push({
          stageName: `${stageName} declaration`,
          layerIndex: index + 1,
          layerCount: layers.length,
          packageCount: layer.length,
          durationMs: layerDurationMs,
        });
      }
      if (ENABLE_BUILD_PROFILE) {
        console.log(chalk.gray(`[@nocobase/build]: ${stageName} declaration layer ${index + 1}/${layers.length} finished in ${formatDuration(layerDurationMs)}`));
      }
    }
  });
}

async function buildSinglePackage(
  pkg: Package,
  targetDir: string,
  doBuildPackage: (cwd: string, userConfig: UserConfig, sourcemap: boolean, log?: PkgLog) => Promise<any>,
  options: {
    stageName: string;
    profile?: BuildProfileCollector | null;
  },
) {
  const { stageName, profile = null } = options;
  await runProfiledStage(profile, `${stageName} source`, async () => {
    await buildPackageSourceLifecycle(pkg, targetDir, doBuildPackage, profile);
  });

  if (process.argv.includes('--no-dts') || process.argv.includes('--only-tar')) {
    return;
  }

  await runProfiledStage(profile, `${stageName} declaration`, async () => {
    await buildPackageDeclarationLifecycle(pkg, targetDir, profile);
  });
}

async function buildPackageSourceLifecycle(
  pkg: Package,
  targetDir: string,
  doBuildPackage: (cwd: string, userConfig: UserConfig, sourcemap: boolean, log?: PkgLog) => Promise<any>,
  profile: BuildProfileCollector | null = null,
) {
  const sourcemap = process.argv.includes('--sourcemap');
  const hasTar = process.argv.includes('--tar');
  const onlyTar = process.argv.includes('--only-tar');

  const log = getPkgLog(pkg.name);
  const packageJson = getPackageJson(pkg.location);

  if (onlyTar) {
    const packageStart = nowMs();
    await tarPlugin(pkg.location, log);
    if (profile) {
      profile.packages.push({
        name: pkg.name,
        targetDir,
        kind: 'source',
        durationMs: nowMs() - packageStart,
        status: 'success',
        phases: { tar: nowMs() - packageStart },
      });
    }
    return;
  }

  log(`${chalk.bold(toUnixPath(pkg.location.replace(PACKAGES_PATH, '').slice(1)))} build start`);

  const userConfig = getUserConfig(pkg.location);
  const packageStart = nowMs();
  const phaseDurations: Record<string, number> = {};
  let status: PackageProfile['status'] = 'success';

  const runPhase = async (phaseName: string, task: () => Promise<void>) => {
    const phaseStart = nowMs();
    await task();
    phaseDurations[phaseName] = (phaseDurations[phaseName] || 0) + (nowMs() - phaseStart);
  };

  // prebuild
  if (packageJson?.scripts?.prebuild) {
    log('prebuild');
    await runPhase('prebuild', async () => {
      await runScript(['prebuild'], pkg.location);
      await packageJson.prebuild(pkg.location);
    });
  }
  if (userConfig.beforeBuild) {
    log('beforeBuild');
    await runPhase('beforeBuild', async () => {
      await userConfig.beforeBuild(log);
    });
  }

  try {
    // build source
    await runPhase('build', async () => {
      await doBuildPackage(pkg.location, userConfig, sourcemap, log);
    });

    // postbuild
    if (packageJson?.scripts?.postbuild) {
      log('postbuild');
      await runPhase('postbuild', async () => {
        await runScript(['postbuild'], pkg.location);
      });
    }

    if (userConfig.afterBuild) {
      log('afterBuild');
      await runPhase('afterBuild', async () => {
        await userConfig.afterBuild(log);
      });
    }

    await runPhase('addLicense', async () => {
      await addLicense(path.join(pkg.location, targetDir), log);
    });

    // tar
    if (hasTar) {
      await runPhase('tar', async () => {
        await tarPlugin(pkg.location, log);
      });
    }
  } catch (error) {
    status = 'failed';
    writeToCache(BUILD_ERROR, { pkg: pkg.name });
    throw error;
  } finally {
    if (profile) {
      profile.packages.push({
        name: pkg.name,
        targetDir,
        kind: 'source',
        durationMs: nowMs() - packageStart,
        status,
        phases: phaseDurations,
      });
      if (ENABLE_BUILD_PROFILE) {
        const summary = Object.entries(phaseDurations)
          .sort((a, b) => b[1] - a[1])
          .map(([name, duration]) => `${name}=${formatDuration(duration)}`)
          .join(', ');
        console.log(
          chalk.gray(
            `[@nocobase/build:profile] ${pkg.name} ${status} in ${formatDuration(nowMs() - packageStart)}${summary ? ` (${summary})` : ''}`,
          ),
        );
      }
    }
  }
}

async function buildPackageDeclarationLifecycle(
  pkg: Package,
  targetDir: string,
  profile: BuildProfileCollector | null = null,
) {
  const log = getPkgLog(pkg.name);
  const packageStart = nowMs();
  const phaseDurations: Record<string, number> = {};
  let status: PackageProfile['status'] = 'success';

  try {
    log('build declaration');
    const phaseStart = nowMs();
    await buildDeclaration(pkg.location, targetDir);
    phaseDurations.declaration = nowMs() - phaseStart;
  } catch (error) {
    status = 'failed';
    writeToCache(BUILD_ERROR, { pkg: pkg.name });
    throw error;
  } finally {
    if (profile) {
      profile.packages.push({
        name: pkg.name,
        targetDir,
        kind: 'declaration',
        durationMs: nowMs() - packageStart,
        status,
        phases: phaseDurations,
      });
      if (ENABLE_BUILD_PROFILE) {
        const summary = Object.entries(phaseDurations)
          .sort((a, b) => b[1] - a[1])
          .map(([name, duration]) => `${name}=${formatDuration(duration)}`)
          .join(', ');
        console.log(
          chalk.gray(
            `[@nocobase/build:profile] ${pkg.name} declaration ${status} in ${formatDuration(nowMs() - packageStart)}${summary ? ` (${summary})` : ''}`,
          ),
        );
      }
    }
  }
}
