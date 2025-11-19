const { dirname, resolve } = require('path');
const { realpath, readFile, writeFile, readdir, symlink, unlink, mkdir, stat } = require('fs').promises;

async function getStoragePluginNames(target) {
  const plugins = [];
  const items = await readdir(target);
  for (const item of items) {
    if (item.startsWith('@')) {
      const dirPath = resolve(target, item);
      const s = await stat(dirPath);
      if (!s.isDirectory()) {
        continue;
      }
      const children = await getStoragePluginNames(dirPath);
      plugins.push(
        ...children.map((child) => {
          return `${item}/${child}`;
        }),
      );
    } else if (await fsExists(resolve(target, item, 'package.json'))) {
      plugins.push(item);
    }
  }
  return plugins;
}

async function fsExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

exports.fsExists = fsExists;

async function createStoragePluginSymLink(pluginName) {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
  const nodeModulesPath = process.env.NODE_MODULES_PATH; // resolve(dirname(require.resolve('@nocobase/server/package.json')), 'node_modules');
  // const nodeModulesPath = resolve(process.cwd(), 'node_modules');
  try {
    if (pluginName.startsWith('@')) {
      const [orgName] = pluginName.split('/');
      if (!(await fsExists(resolve(nodeModulesPath, orgName)))) {
        await mkdir(resolve(nodeModulesPath, orgName), { recursive: true });
      }
    }
    const link = resolve(nodeModulesPath, pluginName);
    if (await fsExists(link)) {
      const realPath = await realpath(link);
      if (realPath !== resolve(storagePluginsPath, pluginName)) {
        return;
      }
    }
    try {
      await unlink(link);
    } catch (error) {
      console.error(`Failed to remove existing symlink for storage plugin: ${pluginName}`);
    }
    await symlink(resolve(storagePluginsPath, pluginName), link, 'dir');
    // console.log(`Created symlink for storage plugin: ${pluginName}`);
  } catch (error) {
    console.error(`Failed to create symlink for storage plugin: ${pluginName}`);
  }
}

exports.createStoragePluginSymLink = createStoragePluginSymLink;

async function createStoragePluginsSymlink() {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
  if (!(await fsExists(storagePluginsPath))) {
    return;
  }
  const pluginNames = await getStoragePluginNames(storagePluginsPath);
  await Promise.all(pluginNames.map((pluginName) => createStoragePluginSymLink(pluginName)));
}

exports.createStoragePluginsSymlink = createStoragePluginsSymlink;

async function createDevPluginSymLink(pluginName) {
  const packagePluginsPath = resolve(process.cwd(), 'packages/plugins');
  const nodeModulesPath = process.env.NODE_MODULES_PATH; // resolve(dirname(require.resolve('@nocobase/server/package.json')), 'node_modules');
  try {
    if (pluginName.startsWith('@')) {
      const [orgName] = pluginName.split('/');
      if (!(await fsExists(resolve(nodeModulesPath, orgName)))) {
        await mkdir(resolve(nodeModulesPath, orgName), { recursive: true });
      }
    }
    const link = resolve(nodeModulesPath, pluginName);
    try {
      await unlink(link);
    } catch (error) {
      console.error(`Failed to remove existing symlink for dev plugin: ${pluginName}`);
    }
    await symlink(resolve(packagePluginsPath, pluginName), link, 'dir');
  } catch (error) {
    console.error(`Failed to create symlink for dev plugin: ${pluginName}`);
  }
}

exports.createDevPluginSymLink = createDevPluginSymLink;

async function createDevPluginsSymlink() {
  const storagePluginsPath = resolve(process.cwd(), 'packages/plugins');
  if (!(await fsExists(storagePluginsPath))) {
    return;
  }
  const pluginNames = await getStoragePluginNames(storagePluginsPath);
  await Promise.all(pluginNames.map((pluginName) => createDevPluginSymLink(pluginName)));
}

exports.createDevPluginsSymlink = createDevPluginsSymlink;
