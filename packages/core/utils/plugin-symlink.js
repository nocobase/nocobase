const { dirname, resolve } = require('path');
const { readFile, writeFile, readdir, symlink, unlink, mkdir, stat } = require('fs').promises;

async function getStoragePluginNames(target) {
  const plugins = [];
  const items = await readdir(target);
  for (const item of items) {
    if (item.startsWith('@')) {
      const children = await getStoragePluginNames(resolve(target, item));
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

async function createStoragePluginSymLink(pluginName) {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
  const nodeModulesPath = resolve(dirname(require.resolve('@nocobase/server/package.json')), 'node_modules');
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
      await unlink(link);
    }
    await symlink(resolve(storagePluginsPath, pluginName), link);
  } catch (error) {
    console.error(error);
  }
}

async function createStoragePluginsSymlink() {
  const storagePluginsPath = resolve(process.cwd(), 'storage/plugins');
  if (!(await fsExists(storagePluginsPath))) {
    return;
  }
  const pluginNames = await getStoragePluginNames(storagePluginsPath);
  await Promise.all(pluginNames.map((pluginName) => createStoragePluginSymLink(pluginName)));
}

exports.createStoragePluginsSymlink = createStoragePluginsSymlink;
