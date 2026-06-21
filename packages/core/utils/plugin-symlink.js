const path = require('path');
const { resolve } = path;
const fs = require('fs-extra');

function resolvePluginStoragePath() {
  if (process.env.PLUGIN_STORAGE_PATH) {
    const p = process.env.PLUGIN_STORAGE_PATH;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  }
  return path.join(process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage'), 'plugins');
}

/**
 * Recursively get plugin names from a directory
 * @param {string} target - Target directory to scan
 * @returns {Promise<string[]>} Array of plugin names
 */
async function getStoragePluginNames(target) {
  const plugins = [];
  const items = await fs.readdir(target);

  for (const item of items) {
    const itemPath = resolve(target, item);

    if (item.startsWith('@')) {
      const statResult = await fs.stat(itemPath);
      if (!statResult.isDirectory()) {
        continue;
      }
      const children = await getStoragePluginNames(itemPath);
      plugins.push(...children.map((child) => `${item}/${child}`));
    } else if (await fs.pathExists(resolve(itemPath, 'package.json'))) {
      plugins.push(item);
    }
  }

  return plugins;
}

async function getPluginNamesFromSourceRoot(rootPath) {
  if (!(await fs.pathExists(rootPath))) {
    return [];
  }
  return await getStoragePluginNames(rootPath);
}

async function isValidPluginSourcePath(candidate) {
  return await fs.pathExists(resolve(candidate, 'package.json'));
}

function getPluginSourceRoots(storagePluginsPath) {
  return [
    resolve(process.cwd(), 'packages/plugins'),
    resolve(process.cwd(), 'packages/pro-plugins'),
    storagePluginsPath,
  ];
}

async function resolvePluginSourcePath(pluginName, storagePluginsPath) {
  const sourceRoots = getPluginSourceRoots(storagePluginsPath);
  for (const rootPath of sourceRoots) {
    const candidate = resolve(rootPath, pluginName);
    if (await isValidPluginSourcePath(candidate)) {
      return candidate;
    }
  }
  return '';
}

/**
 * Ensure the organization directory exists for scoped packages
 * @param {string} nodeModulesPath - Path to node_modules
 * @param {string} pluginName - Plugin name (may be scoped)
 * @returns {Promise<void>}
 */
async function ensureOrgDirectory(nodeModulesPath, pluginName) {
  if (pluginName.startsWith('@')) {
    const [orgName] = pluginName.split('/');
    const orgPath = resolve(nodeModulesPath, orgName);
    await fs.ensureDir(orgPath);
  }
}

/**
 * Check whether node_modules entry is a real directory, symlink, or missing
 * @param {string} linkPath - Path inside node_modules
 * @returns {Promise<'missing'|'dir'|'symlink'|'other'>}
 */
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

async function isSymlinkValid(linkPath, targetPath) {
  try {
    const realPath = await fs.realpath(linkPath);
    return realPath === targetPath;
  } catch {
    return false;
  }
}

/**
 * Remove an existing symlink or file at the given path
 * @param {string} linkPath - Path to remove
 * @param {string} pluginName - Plugin name for error messages
 * @param {string} pluginType - Type of plugin ('storage' or 'dev') for error messages
 * @returns {Promise<void>}
 */
async function removeExistingLink(linkPath, pluginName, pluginType) {
  try {
    await fs.remove(linkPath);
  } catch (error) {
    // Ignore ENOENT errors (file doesn't exist)
    if (error.code !== 'ENOENT') {
      console.error(`Failed to remove existing symlink for ${pluginType} plugin: ${pluginName}`, error.message);
    }
  }
}

/**
 * Create a symlink for a plugin
 * @param {string} pluginName - Name of the plugin
 * @param {string} sourcePath - Source directory path
 * @param {string} nodeModulesPath - Target node_modules path
 * @param {string} pluginType - Type of plugin ('storage' or 'dev')
 * @returns {Promise<void>}
 */
async function createPluginSymLink(pluginName, sourcePath, nodeModulesPath, pluginType) {
  if (!nodeModulesPath) {
    console.error(`NODE_MODULES_PATH is not set, cannot create symlink for ${pluginType} plugin: ${pluginName}`);
    return;
  }

  const distClientIndexPath = resolve(sourcePath, pluginName, 'dist', 'client', 'index.js');

  if (await fs.pathExists(distClientIndexPath)) {
    // Update the mtime of distClientIndexPath
    const now = new Date();
    await fs.utimes(distClientIndexPath, now, now);
  }

  try {
    const targetPath = resolve(sourcePath, pluginName);

    // Check if source exists
    if (!(await fs.pathExists(targetPath))) {
      console.warn(`Source path does not exist for ${pluginType} plugin: ${pluginName} at ${targetPath}`);
      return;
    }

    const linkPath = resolve(nodeModulesPath, pluginName);
    const entryType = await getNodeModulesEntryType(linkPath);

    if (entryType === 'dir') {
      return;
    }

    // Ensure organization directory exists for scoped packages
    await ensureOrgDirectory(nodeModulesPath, pluginName);

    // Check if symlink already points to the correct target
    if (entryType === 'symlink' && (await isSymlinkValid(linkPath, targetPath))) {
      return; // Symlink is already correct, no need to recreate
    }

    // Remove existing link if it exists
    await removeExistingLink(linkPath, pluginName, pluginType);

    // Create new symlink
    await fs.symlink(targetPath, linkPath, 'dir');
  } catch (error) {
    console.error(`Failed to create symlink for ${pluginType} plugin: ${pluginName}`, error.message);
  }
}

/**
 * Create a symlink for a storage plugin
 * @param {string} pluginName - Name of the plugin
 */
async function createStoragePluginSymLink(pluginName) {
  const storagePluginsPath = resolvePluginStoragePath();
  const nodeModulesPath = process.env.NODE_MODULES_PATH;
  await createPluginSymLink(pluginName, storagePluginsPath, nodeModulesPath, 'storage');
}

/**
 * Create symlinks for all storage plugins
 * @returns {Promise<void>}
 */
async function createStoragePluginsSymlink() {
  const storagePluginsPath = resolvePluginStoragePath();
  if (!(await fs.pathExists(storagePluginsPath))) {
    return;
  }
  const pluginNames = await getStoragePluginNames(storagePluginsPath);
  await Promise.all(pluginNames.map((pluginName) => createStoragePluginSymLink(pluginName)));
}

/**
 * Create a symlink for a dev plugin
 * @param {string} pluginName - Name of the plugin
 * @returns {Promise<void>}
 */
async function createDevPluginSymLink(pluginName) {
  const packagePluginsPath = resolve(process.cwd(), 'packages/plugins');
  const nodeModulesPath = process.env.NODE_MODULES_PATH;
  await createPluginSymLink(pluginName, packagePluginsPath, nodeModulesPath, 'dev');
}

/**
 * Create symlinks for all dev plugins
 * @returns {Promise<void>}
 */
async function createDevPluginsSymlink() {
  const packagePluginsPath = resolve(process.cwd(), 'packages/plugins');
  if (!(await fs.pathExists(packagePluginsPath))) {
    return;
  }
  const pluginNames = await getStoragePluginNames(packagePluginsPath);
  await Promise.all(pluginNames.map((pluginName) => createDevPluginSymLink(pluginName)));
}

/**
 * Create symlinks for all plugins from all sources
 * @returns {Promise<void>}
 */
async function syncPluginSymlinks() {
  const nodeModulesPath = process.env.NODE_MODULES_PATH;
  if (!nodeModulesPath) {
    return;
  }

  const storagePluginsPath = resolvePluginStoragePath();
  const sourceRoots = getPluginSourceRoots(storagePluginsPath);
  const pluginNames = new Set();

  for (const rootPath of sourceRoots) {
    const names = await getPluginNamesFromSourceRoot(rootPath);
    names.forEach((name) => pluginNames.add(name));
  }

  await Promise.all(
    [...pluginNames].map(async (pluginName) => {
      const linkPath = resolve(nodeModulesPath, pluginName);
      const entryType = await getNodeModulesEntryType(linkPath);

      if (entryType === 'dir') {
        return;
      }

      const sourcePath = await resolvePluginSourcePath(pluginName, storagePluginsPath);
      if (!sourcePath) {
        if (entryType === 'symlink' || entryType === 'other') {
          await removeExistingLink(linkPath, pluginName, 'plugin');
        }
        return;
      }

      if (entryType === 'symlink' && (await isSymlinkValid(linkPath, sourcePath))) {
        return;
      }

      await ensureOrgDirectory(nodeModulesPath, pluginName);
      await removeExistingLink(linkPath, pluginName, 'plugin');
      await fs.symlink(sourcePath, linkPath, 'dir');
    }),
  );
}

exports.resolvePluginStoragePath = resolvePluginStoragePath;
exports.getStoragePluginNames = getStoragePluginNames;
exports.getPluginSourceRoots = getPluginSourceRoots;
exports.resolvePluginSourcePath = resolvePluginSourcePath;
exports.createStoragePluginSymLink = createStoragePluginSymLink;
exports.createStoragePluginsSymlink = createStoragePluginsSymlink;
exports.createDevPluginSymLink = createDevPluginSymLink;
exports.createDevPluginsSymlink = createDevPluginsSymlink;
exports.syncPluginSymlinks = syncPluginSymlinks;
