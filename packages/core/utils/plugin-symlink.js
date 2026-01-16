const { resolve } = require('path');
const fs = require('fs-extra');

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
 * Check if a symlink already points to the correct target
 * @param {string} linkPath - Path to the symlink
 * @param {string} targetPath - Expected target path
 * @returns {Promise<boolean>} True if symlink exists and points to target
 */
async function isSymlinkValid(linkPath, targetPath) {
  try {
    if (await fs.pathExists(linkPath)) {
      const realPath = await fs.realpath(linkPath);
      return realPath === targetPath;
    }
  } catch (error) {
    // If realpath fails, the symlink is invalid
    return false;
  }
  return false;
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

    // Ensure organization directory exists for scoped packages
    await ensureOrgDirectory(nodeModulesPath, pluginName);

    const linkPath = resolve(nodeModulesPath, pluginName);

    // Check if symlink already points to the correct target
    if (await isSymlinkValid(linkPath, targetPath)) {
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
 * @returns {Promise<void>}
 */
async function createStoragePluginSymLink(pluginName) {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
  const nodeModulesPath = process.env.NODE_MODULES_PATH;
  await createPluginSymLink(pluginName, storagePluginsPath, nodeModulesPath, 'storage');
}

/**
 * Create symlinks for all storage plugins
 * @returns {Promise<void>}
 */
async function createStoragePluginsSymlink() {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
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

exports.createStoragePluginSymLink = createStoragePluginSymLink;
exports.createStoragePluginsSymlink = createStoragePluginsSymlink;
exports.createDevPluginSymLink = createDevPluginSymLink;
exports.createDevPluginsSymlink = createDevPluginsSymlink;
