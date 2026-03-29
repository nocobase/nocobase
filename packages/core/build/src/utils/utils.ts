/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import chalk from 'chalk';
import execa from 'execa';
import path from 'path';
import fg from 'fast-glob';
import fs from 'fs-extra';
import { Options as TsupConfig } from 'tsup'
import type { RsbuildConfig } from '@rsbuild/core'
import { register } from 'esbuild-register/dist/node';
import { NODE_MODULES } from '../constant';

let previousColor = '';
function randomColor() {
  const colors = [
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'gray',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
  ];

  let color = previousColor;
  while (color === previousColor) {
    const randomIndex = Math.floor(Math.random() * colors.length);
    color = colors[randomIndex];
  }

  previousColor = color;
  return chalk[color];
}

export type PkgLog = (msg: string, ...args: any[]) => void;
export type StageProfile = {
  name: string;
  durationMs: number;
};

export type LayerProfile = {
  stageName: string;
  layerIndex: number;
  layerCount: number;
  packageCount: number;
  durationMs: number;
};

export type PackageProfile = {
  name: string;
  targetDir: string;
  kind: 'source' | 'declaration';
  durationMs: number;
  status: 'success' | 'failed';
  phases: Record<string, number>;
};

export type BuildProfileCollector = {
  stages: StageProfile[];
  layers: LayerProfile[];
  packages: PackageProfile[];
};

export const getPkgLog = (pkgName: string) => {
  const pkgColor = randomColor();
  const pkgStr = chalk.bold(pkgColor(pkgName));
  const pkgLog: PkgLog = (msg: string, ...optionalParams: any[]) => console.log(`${pkgStr}: ${msg}`, ...optionalParams);
  return pkgLog;
};

export function toUnixPath(filepath: string) {
  return filepath.replace(/\\/g, '/');
}

export function getPackageJson(cwd: string) {
  return require(path.join(cwd, 'package.json'));
}

export interface UserConfig {
  modifyTsupConfig?: (config: TsupConfig) => TsupConfig;
  modifyRsbuildConfig?: (config: RsbuildConfig) => RsbuildConfig;
  beforeBuild?: (log: PkgLog) => void | Promise<void>;
  afterBuild?: (log: PkgLog) => void | Promise<void>;
}

export function defineConfig(config: UserConfig): UserConfig {
  return config;
}

export function getUserConfig(cwd: string) {
  const config = defineConfig({
    modifyTsupConfig: (config: TsupConfig) => config,
    modifyRsbuildConfig: (config: RsbuildConfig) => config,
  });

  const buildConfigs = fg.sync(['build.config.js', 'build.config.ts'], { cwd });
  if (buildConfigs.length > 1) {
    throw new Error(`Multiple build configs found: ${buildConfigs.join(', ')}`);
  }
  if (buildConfigs.length === 1) {
    const { unregister } = register({})
    const userConfig = require(path.join(cwd, buildConfigs[0]));
    unregister()
    Object.assign(config, userConfig.default || userConfig);
  }
  return config;
}

const CACHE_DIR = path.join(NODE_MODULES, '.cache', 'nocobase');
export function writeToCache(key: string, data: Record<string, any>) {
  const cachePath = path.join(CACHE_DIR, `${key}.json`);
  fs.ensureDirSync(path.dirname(cachePath));
  fs.writeJsonSync(cachePath, data, { spaces: 2 });
}

export function readFromCache(key: string) {
  const cachePath = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(cachePath)) {
    return fs.readJsonSync(cachePath);
  }
  return {};
}


export function getEnvDefine() {
  return {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.__TEST__': false,
    'process.env.__E2E__': process.env.__E2E__ ? true : false,
    'process.env.APP_ENV': process.env.APP_ENV,
  }
}

export function createBuildProfileCollector(): BuildProfileCollector {
  return {
    stages: [],
    layers: [],
    packages: [],
  };
}

export async function runProfiledStage(
  profile: BuildProfileCollector | null,
  stageName: string,
  task: () => Promise<void>,
) {
  const startedAt = nowMs();
  await task();
  if (profile) {
    profile.stages.push({
      name: stageName,
      durationMs: nowMs() - startedAt,
    });
  }
}

export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) {
        return;
      }
      await worker(item);
    }
  });

  await Promise.all(workers);
}

export function printBuildProfile(profile: BuildProfileCollector, totalDurationMs: number) {
  const phaseTotals = new Map<string, number>();
  for (const pkg of profile.packages) {
    for (const [phaseName, duration] of Object.entries(pkg.phases)) {
      phaseTotals.set(phaseName, (phaseTotals.get(phaseName) || 0) + duration);
    }
  }

  console.log(chalk.cyan(`[@nocobase/build:profile] total build time ${formatDuration(totalDurationMs)}`));

  if (profile.stages.length > 0) {
    console.log(chalk.cyan('[@nocobase/build:profile] stage totals'));
    for (const stage of [...profile.stages].sort((a, b) => b.durationMs - a.durationMs)) {
      console.log(chalk.gray(`  ${stage.name}: ${formatDuration(stage.durationMs)}`));
    }
  }

  if (profile.layers.length > 0) {
    console.log(chalk.cyan('[@nocobase/build:profile] slowest layers'));
    for (const layer of [...profile.layers].sort((a, b) => b.durationMs - a.durationMs).slice(0, 12)) {
      console.log(
        chalk.gray(
          `  ${layer.stageName} layer ${layer.layerIndex}/${layer.layerCount} (${layer.packageCount} packages): ${formatDuration(layer.durationMs)}`,
        ),
      );
    }
  }

  if (phaseTotals.size > 0) {
    console.log(chalk.cyan('[@nocobase/build:profile] aggregated package phases'));
    for (const [phaseName, duration] of [...phaseTotals.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(chalk.gray(`  ${phaseName}: ${formatDuration(duration)}`));
    }
  }

  if (profile.packages.length > 0) {
    const sourcePackages = profile.packages.filter((pkg) => pkg.kind === 'source');
    const declarationPackages = profile.packages.filter((pkg) => pkg.kind === 'declaration');

    console.log(chalk.cyan('[@nocobase/build:profile] slowest source packages'));
    for (const pkg of [...sourcePackages].sort((a, b) => b.durationMs - a.durationMs).slice(0, 20)) {
      const summary = Object.entries(pkg.phases)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, duration]) => `${name}=${formatDuration(duration)}`)
        .join(', ');
      console.log(
        chalk.gray(
          `  ${pkg.name} [${pkg.status}] ${formatDuration(pkg.durationMs)}${summary ? ` (${summary})` : ''}`,
        ),
      );
    }

    console.log(chalk.cyan('[@nocobase/build:profile] slowest declaration packages'));
    for (const pkg of [...declarationPackages].sort((a, b) => b.durationMs - a.durationMs).slice(0, 20)) {
      const summary = Object.entries(pkg.phases)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, duration]) => `${name}=${formatDuration(duration)}`)
        .join(', ');
      console.log(
        chalk.gray(
          `  ${pkg.name} [${pkg.status}] ${formatDuration(pkg.durationMs)}${summary ? ` (${summary})` : ''}`,
        ),
      );
    }
  }
}

export function nowMs() {
  return Date.now();
}

export function formatDuration(durationMs: number) {
  if (durationMs >= 60_000) {
    return `${(durationMs / 60_000).toFixed(2)}m`;
  }
  if (durationMs >= 1_000) {
    return `${(durationMs / 1_000).toFixed(2)}s`;
  }
  return `${Math.round(durationMs)}ms`;
}

export function runScript(args: string[], cwd: string, envs: Record<string, string> = {}) {
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
