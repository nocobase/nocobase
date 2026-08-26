const fs = require('fs-extra');
const path = require('path');
const {
  getPluginSourceRoots,
  getStoragePluginNames,
  resolvePluginSourcePath,
  resolvePluginStoragePath,
} = require('./plugin-symlink');

const DEFAULT_PLUGIN_PACKAGE_PREFIXES = ['@nocobase/plugin-', '@nocobase/preset-'];
const PRESET_PACKAGE_NAME = '@nocobase/preset-nocobase';

function uniqStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitPluginNames(value) {
  return uniqStrings(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getPluginPackagePrefixes() {
  const prefixes = splitPluginNames(process.env.PLUGIN_PACKAGE_PREFIX || DEFAULT_PLUGIN_PACKAGE_PREFIXES.join(','));
  return prefixes.length > 0 ? prefixes : DEFAULT_PLUGIN_PACKAGE_PREFIXES;
}

function getPluginNameFromPackageName(packageName, prefixes = getPluginPackagePrefixes()) {
  const prefix = prefixes.find((item) => packageName.startsWith(item));
  return prefix ? packageName.slice(prefix.length) : packageName;
}

function isValidPackageName(packageName) {
  if (!packageName || typeof packageName !== 'string') {
    return false;
  }

  if (packageName.includes('\0')) {
    return false;
  }

  if (path.isAbsolute(packageName)) {
    return false;
  }

  if (packageName.includes('..') || packageName.includes('\\')) {
    return false;
  }

  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(packageName);
}

function looksLikePluginPackage(packageName) {
  return isValidPackageName(packageName);
}

async function parsePluginName(nameOrPkg, options = {}) {
  const input = String(nameOrPkg || '').trim();
  const prefixes = options.pluginPackagePrefixes || getPluginPackagePrefixes();

  if (!input) {
    return { name: '', packageName: '' };
  }

  const matchedPrefix = prefixes.find((prefix) => input.startsWith(prefix));
  if (matchedPrefix) {
    return {
      packageName: input,
      name: input.slice(matchedPrefix.length),
    };
  }

  const nodeModulesPath = String(options.nodeModulesPath || process.env.NODE_MODULES_PATH || '').trim();
  if (nodeModulesPath) {
    for (const prefix of prefixes) {
      const candidate = `${prefix}${input}`;
      if (await fs.pathExists(path.resolve(nodeModulesPath, candidate, 'package.json'))) {
        return { name: input, packageName: candidate };
      }
    }
  }

  return { name: input, packageName: input };
}

function getPresetPackageJsonCandidates(options = {}) {
  const candidates = [];
  const nodeModulesPath = String(options.nodeModulesPath || process.env.NODE_MODULES_PATH || '').trim();

  if (nodeModulesPath) {
    candidates.push(path.resolve(nodeModulesPath, PRESET_PACKAGE_NAME, 'package.json'));
  }

  candidates.push(path.resolve(options.cwd || process.cwd(), 'packages/presets/nocobase/package.json'));
  return uniqStrings(candidates);
}

async function getPresetNocoBasePackageJson(options = {}) {
  for (const packageJsonPath of getPresetPackageJsonCandidates(options)) {
    if (await fs.pathExists(packageJsonPath)) {
      return fs.readJson(packageJsonPath);
    }
  }
  return null;
}

async function getNodeModulesEntryType(linkPath) {
  try {
    const statResult = await fs.lstat(linkPath);
    if (statResult.isSymbolicLink()) {
      return 'symlink';
    }
    if (statResult.isDirectory()) {
      return 'dir';
    }
    return 'other';
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 'missing';
    }
    return 'other';
  }
}

async function resolvePluginPackagePath(packageName, options = {}) {
  const normalizedPackageName = String(packageName || '').trim();
  if (!normalizedPackageName) {
    return '';
  }

  const nodeModulesPath = String(options.nodeModulesPath || process.env.NODE_MODULES_PATH || '').trim();
  const storagePluginsPath = options.storagePluginsPath || resolvePluginStoragePath();
  const nodeModulesPackagePath = nodeModulesPath ? path.resolve(nodeModulesPath, normalizedPackageName) : '';

  if (nodeModulesPackagePath) {
    const entryType = await getNodeModulesEntryType(nodeModulesPackagePath);
    if (entryType === 'dir') {
      return nodeModulesPackagePath;
    }
  }

  const sourcePath = await resolvePluginSourcePath(normalizedPackageName, storagePluginsPath);
  if (sourcePath) {
    return sourcePath;
  }

  if (nodeModulesPackagePath && (await fs.pathExists(path.resolve(nodeModulesPackagePath, 'package.json')))) {
    return nodeModulesPackagePath;
  }

  return '';
}

async function readPluginPackagesFromRoot(rootPath) {
  if (!rootPath || !(await fs.pathExists(rootPath))) {
    return [];
  }

  const relativePluginDirs = await getStoragePluginNames(rootPath);
  const items = [];

  for (const relativePluginDir of relativePluginDirs) {
    const packageJsonPath = path.resolve(rootPath, relativePluginDir, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      continue;
    }
    const packageJson = await fs.readJson(packageJsonPath);
    const packageName = String(packageJson?.name || '').trim();

    if (!looksLikePluginPackage(packageName)) {
      continue;
    }

    items.push({
      packageName,
      packagePath: path.resolve(rootPath, relativePluginDir),
      sourceRoot: rootPath,
    });
  }

  return items;
}

function pushOrigin(targetMap, packageName, origin) {
  if (!packageName) {
    return;
  }
  if (!targetMap.has(packageName)) {
    targetMap.set(packageName, new Set());
  }
  targetMap.get(packageName).add(origin);
}

async function discoverPluginPackages(options = {}) {
  const nodeModulesPath = String(options.nodeModulesPath || process.env.NODE_MODULES_PATH || '').trim();
  const storagePluginsPath = options.storagePluginsPath || resolvePluginStoragePath();
  const prefixes = options.pluginPackagePrefixes || getPluginPackagePrefixes();
  const originsByPackageName = new Map();

  const presetPackageJson = await getPresetNocoBasePackageJson({ nodeModulesPath, cwd: options.cwd });
  const presetDependencies = Object.keys(presetPackageJson?.dependencies || {}).filter((packageName) =>
    packageName.startsWith('@nocobase/plugin-'),
  );

  for (const packageName of presetDependencies) {
    pushOrigin(originsByPackageName, packageName, 'preset-dependency');
  }

  const sourceRoots = getPluginSourceRoots(storagePluginsPath);
  for (const sourceRoot of sourceRoots) {
    const packages = await readPluginPackagesFromRoot(sourceRoot);
    for (const item of packages) {
      pushOrigin(originsByPackageName, item.packageName, sourceRoot);
    }
  }

  for (const packageNameOrName of splitPluginNames(process.env.APPEND_PRESET_BUILT_IN_PLUGINS)) {
    const { packageName } = await parsePluginName(packageNameOrName, {
      nodeModulesPath,
      pluginPackagePrefixes: prefixes,
    });
    pushOrigin(originsByPackageName, packageName, 'append-built-in');
  }

  for (const packageNameOrName of splitPluginNames(process.env.APPEND_PRESET_LOCAL_PLUGINS)) {
    const { packageName } = await parsePluginName(packageNameOrName, {
      nodeModulesPath,
      pluginPackagePrefixes: prefixes,
    });
    pushOrigin(originsByPackageName, packageName, 'append-local');
  }

  const items = [];
  for (const [packageName, origins] of originsByPackageName.entries()) {
    const resolvedPath = await resolvePluginPackagePath(packageName, {
      nodeModulesPath,
      storagePluginsPath,
    });

    if (!resolvedPath) {
      continue;
    }

    const { name } = await parsePluginName(packageName, { nodeModulesPath, pluginPackagePrefixes: prefixes });
    items.push({
      name,
      packageName,
      origins: [...origins],
      resolvedPath,
    });
  }

  return items.sort((a, b) => a.packageName.localeCompare(b.packageName));
}

exports.DEFAULT_PLUGIN_PACKAGE_PREFIXES = DEFAULT_PLUGIN_PACKAGE_PREFIXES;
exports.getPluginPackagePrefixes = getPluginPackagePrefixes;
exports.getPluginNameFromPackageName = getPluginNameFromPackageName;
exports.getPresetNocoBasePackageJson = getPresetNocoBasePackageJson;
exports.isValidPackageName = isValidPackageName;
exports.looksLikePluginPackage = looksLikePluginPackage;
exports.parsePluginName = parsePluginName;
exports.resolvePluginPackagePath = resolvePluginPackagePath;
exports.discoverPluginPackages = discoverPluginPackages;
exports.splitPluginNames = splitPluginNames;
