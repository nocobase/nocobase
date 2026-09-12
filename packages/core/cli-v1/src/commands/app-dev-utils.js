/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');
const { resolvePluginStoragePath } = require('../util');

const pluginClientLanes = {
  client: {
    rootEntryFile: 'client.js',
    sourceDir: 'client',
  },
  'client-v2': {
    rootEntryFile: 'client-v2.js',
    sourceDir: 'client-v2',
  },
};

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function getEntryName(packageName, lane) {
  return `${packageName.replace(/[^a-zA-Z0-9_]/g, '_')}__${lane.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function readPackageName(packageJsonPath) {
  try {
    return fs.readJsonSync(packageJsonPath).name;
  } catch (error) {
    return '';
  }
}

function findLocalPluginPackageJsons(cwd = process.cwd()) {
  return fg.sync(['packages/plugins/*/package.json', 'packages/plugins/@*/*/package.json'], {
    cwd,
    absolute: true,
    onlyFiles: true,
  });
}

function findPluginClientPackageJsons(cwd = process.cwd()) {
  return fg.sync(
    [
      'packages/plugins/*/package.json',
      'packages/plugins/@*/*/package.json',
      'node_modules/@nocobase/plugin-*/package.json',
      'node_modules/@nocobase/preset-*/package.json',
    ],
    {
      cwd,
      absolute: true,
      onlyFiles: true,
    },
  );
}

function getPluginClientModuleIds({ cwd = process.cwd(), packageJsonPaths = findPluginClientPackageJsons(cwd) } = {}) {
  const moduleIds = new Set();

  for (const packageJsonPath of packageJsonPaths) {
    const pluginDir = path.dirname(packageJsonPath);
    const packageName = readPackageName(packageJsonPath);
    if (!packageName) {
      continue;
    }

    for (const [lane, config] of Object.entries(pluginClientLanes)) {
      if (fs.existsSync(path.join(pluginDir, config.rootEntryFile))) {
        moduleIds.add(`${packageName}/${lane}`);
      }
    }
  }

  return [...moduleIds];
}

function createPluginClientExternals(moduleIds) {
  return moduleIds.reduce((memo, moduleId) => {
    memo[moduleId] = `window.__nocobase_app_dev_plugins__ && window.__nocobase_app_dev_plugins__[${JSON.stringify(
      moduleId,
    )}]`;
    return memo;
  }, {});
}

function discoverLocalPluginEntries({ cwd = process.cwd(), port } = {}) {
  const entries = [];

  for (const packageJsonPath of findLocalPluginPackageJsons(cwd)) {
    const pluginDir = path.dirname(packageJsonPath);
    const packageJson = fs.readJsonSync(packageJsonPath);
    const packageName = packageJson.name;
    if (!packageName) {
      continue;
    }

    for (const [lane, config] of Object.entries(pluginClientLanes)) {
      const rootEntry = path.join(pluginDir, config.rootEntryFile);
      const sourceEntry = fg.sync('index.{ts,tsx,js,jsx}', {
        cwd: path.join(pluginDir, 'src', config.sourceDir),
        absolute: true,
        onlyFiles: true,
      })[0];

      if (!fs.existsSync(rootEntry) || !sourceEntry) {
        continue;
      }

      const entryName = getEntryName(packageName, lane);
      entries.push({
        packageName,
        lane,
        entryName,
        sourceEntry,
        url: port ? `http://localhost:${port}/${entryName}.js` : '',
      });
    }
  }

  return entries;
}

function buildPluginDevUrlMap(entries) {
  return entries.reduce((memo, item) => {
    memo[item.packageName] = memo[item.packageName] || {};
    memo[item.packageName][item.lane] = item.url;
    return memo;
  }, {});
}

function shouldUseAppDevServerSource({ env = process.env, cwd = process.cwd(), existsSync = fs.existsSync } = {}) {
  if (env.NOCOBASE_APP_DEV !== 'true' || env.APP_ENV === 'production' || !env.APP_PACKAGE_ROOT) {
    return false;
  }

  return existsSync(path.resolve(cwd, env.APP_PACKAGE_ROOT, 'src/index.ts'));
}

function buildAppDevServerArgs({
  appPackageRoot = process.env.APP_PACKAGE_ROOT,
  argv = process.argv,
  serverTsconfigPath = process.env.SERVER_TSCONFIG_PATH,
} = {}) {
  const args = ['watch', '--clear-screen=false', `--ignore=${resolvePluginStoragePath()}/**`];

  if (serverTsconfigPath) {
    args.push('--tsconfig', serverTsconfigPath);
  }

  args.push('-r', 'tsconfig-paths/register', path.join(appPackageRoot, 'src/index.ts'), ...argv.slice(2));
  return args;
}

async function writePluginDevEntryFiles(entries, entryDir) {
  await fs.ensureDir(entryDir);
  await fs.emptyDir(entryDir);

  const rsbuildEntries = {};
  for (const entry of entries) {
    const entryFile = path.join(entryDir, `${entry.entryName}.tsx`);
    const sourceEntry = toPosixPath(entry.sourceEntry);
    await fs.writeFile(
      entryFile,
      [`export { default } from '${sourceEntry}';`, `export * from '${sourceEntry}';`, ''].join('\n'),
      'utf-8',
    );
    rsbuildEntries[entry.entryName] = entryFile;
  }

  return rsbuildEntries;
}

module.exports = {
  buildAppDevServerArgs,
  buildPluginDevUrlMap,
  createPluginClientExternals,
  discoverLocalPluginEntries,
  getPluginClientModuleIds,
  shouldUseAppDevServerSource,
  toPosixPath,
  writePluginDevEntryFiles,
};
