import path from 'path';
import { Package } from '@lerna/package';

export const globExcludeFiles = [
  '!src/**/__tests__',
  '!src/**/__test__',
  '!src/**/demos',
  '!src/**/fixtures',
  '!src/**/*.mdx',
  '!src/**/*.md',
  '!src/**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)',
];
export const EsbuildSupportExts = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.css',
  '.less',
  '.sass',
  '.scss',
  '.styl',
  '.txt',
  '.data',
];
export const ROOT_PATH = path.join(__dirname, '../../../../');
export const PACKAGES_PATH = path.join(ROOT_PATH, 'packages');
export const PLUGINS_DIR = [path.join(PACKAGES_PATH, 'plugins'), path.join(PACKAGES_PATH, 'samples')];
export const PRESETS_DIR = path.join(PACKAGES_PATH, 'presets');
export const getPluginPackages = (packages: Package[]) =>
  packages.filter((item) => PLUGINS_DIR.some((pluginDir) => item.location.startsWith(pluginDir)));
export const getPresetsPackages = (packages: Package[]) =>
  packages.filter((item) => item.location.startsWith(PRESETS_DIR));
export const CORE_APP = path.join(PACKAGES_PATH, 'core/app');
export const CORE_CLIENT = path.join(PACKAGES_PATH, 'core/client');
export const CJS_EXCLUDE_PACKAGES = [
  path.join(PACKAGES_PATH, 'core/build'),
  path.join(PACKAGES_PATH, 'core/cli'),
  CORE_CLIENT,
];
export const getCjsPackages = (packages: Package[]) =>
  packages
    .filter((item) => !PLUGINS_DIR.some((dir) => item.location.startsWith(dir)))
    .filter((item) => !item.location.startsWith(PRESETS_DIR))
    .filter((item) => !CJS_EXCLUDE_PACKAGES.includes(item.location));
