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
const { discoverPluginPackages } = require('@nocobase/utils/plugin-package');

const PORTAL_REGISTRY_DIR = 'portal-registry';
const PORTAL_REGISTRY_CONFIG = 'registry.config.json';
const REGISTRY_ITEM_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const REGISTRY_ITEM_TYPES = new Set([
  'registry:block',
  'registry:component',
  'registry:hook',
  'registry:lib',
  'registry:page',
  'registry:style',
  'registry:theme',
]);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function assertSafeRelativePath(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty relative path`);
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
  if (
    path.posix.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.includes('\0')
  ) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return normalized || '.';
}

function isIncluded(file, includes) {
  return includes.some((entry) => entry === '.' || file === entry || file.startsWith(`${entry}/`));
}

function validateStringArray(value, label) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label} must be an array of non-empty strings`);
  }
}

async function loadPluginPortalRegistry(plugin) {
  const sourceRoot = path.resolve(plugin.resolvedPath, PORTAL_REGISTRY_DIR);
  const configPath = path.resolve(sourceRoot, PORTAL_REGISTRY_CONFIG);
  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  const packageJson = await fs.readJson(path.resolve(plugin.resolvedPath, 'package.json'));
  if (packageJson.name !== plugin.packageName || typeof packageJson.version !== 'string' || !packageJson.version) {
    throw new Error(`${plugin.packageName}: package.json must contain the matching name and a version`);
  }

  const config = await fs.readJson(configPath);
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${plugin.packageName}: ${PORTAL_REGISTRY_CONFIG} must contain an object`);
  }
  if (!Array.isArray(config.items) || config.items.length === 0) {
    throw new Error(`${plugin.packageName}: registry.config.json must contain at least one item`);
  }

  const defaultTarget = assertSafeRelativePath(config.target, `${plugin.packageName} target`);
  if (!defaultTarget.startsWith('src/')) {
    throw new Error(`${plugin.packageName}: target must be inside src/`);
  }

  const allFiles = (
    await fg(['**/*', `!${PORTAL_REGISTRY_CONFIG}`], {
      cwd: sourceRoot,
      dot: true,
      onlyFiles: true,
    })
  )
    .map(toPosixPath)
    .sort((left, right) => left.localeCompare(right));

  const items = config.items.map((item, index) => {
    const itemLabel = `${plugin.packageName} item ${index + 1}`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${itemLabel} must be an object`);
    }
    if (typeof item.name !== 'string' || !REGISTRY_ITEM_NAME_PATTERN.test(item.name)) {
      throw new Error(`${itemLabel} has an invalid name: ${item.name}`);
    }
    if (!REGISTRY_ITEM_TYPES.has(item.type)) {
      throw new Error(`${plugin.packageName} item ${item.name} has an unsupported type: ${item.type}`);
    }

    validateStringArray(item.dependencies, `${plugin.packageName} item ${item.name} dependencies`);
    validateStringArray(item.registryDependencies, `${plugin.packageName} item ${item.name} registryDependencies`);

    if (!Array.isArray(item.include) || item.include.length === 0) {
      throw new Error(`${plugin.packageName} item ${item.name} must include at least one path`);
    }
    const include = item.include.map((entry) =>
      assertSafeRelativePath(entry, `${plugin.packageName} item ${item.name} include`),
    );
    const files = allFiles.filter((file) => isIncluded(file, include));
    if (files.length === 0) {
      throw new Error(`${plugin.packageName} item ${item.name} include paths did not match any files`);
    }

    return {
      ...item,
      include,
      target: defaultTarget,
      files,
    };
  });

  return {
    plugin,
    packageVersion: packageJson.version,
    sourceRoot,
    config: {
      ...config,
      target: defaultTarget,
      items,
    },
  };
}

function validateRegistrySet(registries, options = {}) {
  const itemsByName = new Map();
  const items = new Map();
  const targets = new Map();
  const extensionTargets = new Map();

  for (const registry of registries) {
    const existingExtensionTarget = extensionTargets.get(registry.config.target);
    if (existingExtensionTarget && existingExtensionTarget.plugin.packageName !== registry.plugin.packageName) {
      throw new Error(
        `Portal Registry extension target '${registry.config.target}' is shared by ${existingExtensionTarget.plugin.packageName} and ${registry.plugin.packageName}`,
      );
    }
    extensionTargets.set(registry.config.target, registry);

    for (const item of registry.config.items) {
      const existingItem = itemsByName.get(item.name);
      if (existingItem) {
        throw new Error(
          `Duplicate portal Registry item '${item.name}' in ${existingItem.plugin.packageName} and ${registry.plugin.packageName}`,
        );
      }
      itemsByName.set(item.name, registry);
      items.set(item.name, item);

      for (const file of item.files) {
        const target = path.posix.join(item.target, file);
        const existingTarget = targets.get(target);
        if (existingTarget && existingTarget.item.name !== item.name) {
          throw new Error(
            `Portal Registry target collision '${target}' between ${existingTarget.plugin.packageName}:${existingTarget.item.name} and ${registry.plugin.packageName}:${item.name}`,
          );
        }
        targets.set(target, { plugin: registry.plugin, item });
      }
    }
  }

  for (const registry of registries) {
    for (const item of registry.config.items) {
      for (const dependency of item.registryDependencies || []) {
        if (!dependency.startsWith('@nocobase/')) {
          continue;
        }
        const dependencyName = dependency.slice('@nocobase/'.length);
        if (!itemsByName.has(dependencyName)) {
          if (options.allowMissingDependencies) {
            continue;
          }
          throw new Error(
            `${registry.plugin.packageName} item ${item.name} depends on missing portal Registry item '${dependencyName}'`,
          );
        }
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (itemName, chain) => {
    if (visited.has(itemName)) {
      return;
    }
    if (visiting.has(itemName)) {
      throw new Error(`Circular portal Registry dependency: ${[...chain, itemName].join(' -> ')}`);
    }
    visiting.add(itemName);
    const item = items.get(itemName);
    if (!item) {
      visiting.delete(itemName);
      visited.add(itemName);
      return;
    }
    for (const dependency of item.registryDependencies || []) {
      if (dependency.startsWith('@nocobase/')) {
        visit(dependency.slice('@nocobase/'.length), [...chain, itemName]);
      }
    }
    visiting.delete(itemName);
    visited.add(itemName);
  };
  for (const itemName of items.keys()) {
    visit(itemName, []);
  }
}

function selectPortalRegistryEntries(entries, packageSelectors = [], cwd = process.cwd()) {
  const selectors = packageSelectors.map((item) => String(item).trim()).filter(Boolean);
  if (selectors.length === 0) {
    return entries;
  }

  const packageNames = new Set(selectors);
  const pathSelectors = selectors.filter((item) => !item.startsWith('@'));
  const selectedDirectories = fg.sync(pathSelectors, {
    cwd,
    absolute: true,
    onlyDirectories: true,
  });

  return entries.filter((entry) => {
    const plugin = entry.plugin || entry;
    if (packageNames.has(plugin.packageName)) {
      return true;
    }
    const pluginPath = path.resolve(plugin.resolvedPath);
    return selectedDirectories.some((directory) => {
      const relativePath = path.relative(path.resolve(directory), pluginPath);
      return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
    });
  });
}

async function discoverPortalRegistryPackages(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const plugins = await discoverPluginPackages({
    cwd,
    nodeModulesPath: options.nodeModulesPath || process.env.NODE_MODULES_PATH || path.resolve(cwd, 'node_modules'),
    storagePluginsPath: options.storagePluginsPath || path.resolve(cwd, 'storage/plugins'),
  });
  const selectedPlugins = selectPortalRegistryEntries(plugins, options.packageSelectors, cwd);
  const registries = [];

  for (const plugin of selectedPlugins) {
    const registry = await loadPluginPortalRegistry(plugin);
    if (registry) {
      registries.push(registry);
    }
  }

  validateRegistrySet(registries, {
    allowMissingDependencies: Array.isArray(options.packageSelectors) && options.packageSelectors.length > 0,
  });
  return { plugins: selectedPlugins, registries };
}

async function discoverPortalRegistries(options = {}) {
  const { registries } = await discoverPortalRegistryPackages(options);
  return registries;
}

module.exports = {
  PORTAL_REGISTRY_CONFIG,
  PORTAL_REGISTRY_DIR,
  assertSafeRelativePath,
  discoverPortalRegistryPackages,
  discoverPortalRegistries,
  isIncluded,
  loadPluginPortalRegistry,
  selectPortalRegistryEntries,
  toPosixPath,
  validateRegistrySet,
};
