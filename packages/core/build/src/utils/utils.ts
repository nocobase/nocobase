import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { Options as TsupConfig } from 'tsup'
import { InlineConfig as ViteConfig } from 'vite'
import { register } from 'esbuild-register/dist/node';

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
  modifyViteConfig?: (config: ViteConfig) => ViteConfig;
  beforeBuild?: (log: PkgLog) => void | Promise<void>;
  afterBuild?: (log: PkgLog) => void | Promise<void>;
}

export function defineConfig(config: UserConfig): UserConfig {
  return config;
}

export function getUserConfig(cwd: string) {
  const config = defineConfig({
    modifyTsupConfig: (config: TsupConfig) => config,
    modifyViteConfig: (config: ViteConfig) => config,
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
