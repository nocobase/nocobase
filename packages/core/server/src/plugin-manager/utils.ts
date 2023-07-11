import axios from 'axios';
import download from 'download';
import fs from 'fs-extra';
import { builtinModules } from 'module';
import os from 'os';
import path from 'path';
import { version } from '../../package.json';
import { APP_NAME, DEFAULT_PLUGIN_PATH, DEFAULT_PLUGIN_STORAGE_PATH, NODE_MODULES_PATH } from './constants';
import { PluginData } from './types';

/**
 * get temp dir
 *
 * @example
 * getTempDir('dayjs') => '/tmp/nocobase/dayjs'
 */
export async function getTempDir(packageName: string) {
  const temporaryDirectory = await fs.realpath(os.tmpdir());
  return path.join(temporaryDirectory, APP_NAME, packageName);
}

export function getPluginStoragePath() {
  const pluginStoragePath = process.env.PLUGIN_STORAGE_PATH || DEFAULT_PLUGIN_STORAGE_PATH;
  return path.isAbsolute(pluginStoragePath) ? pluginStoragePath : path.join(process.cwd(), pluginStoragePath);
}

export function getPluginPackagesPath() {
  const pluginPackagesPath = process.env.PLUGIN_PATH || DEFAULT_PLUGIN_PATH;
  return path.isAbsolute(pluginPackagesPath) ? pluginPackagesPath : path.join(process.cwd(), pluginPackagesPath);
}

export function getStoragePluginDir(packageName: string) {
  return path.join(getPluginStoragePath(), packageName);
}

export function getNodeModulesPluginDir(packageName: string) {
  return path.join(NODE_MODULES_PATH, packageName);
}

/**
 * get latest version from npm
 *
 * @example
 * getLatestVersion('dayjs', 'https://registry.npmjs.org') => '1.10.6'
 */
export async function getLatestVersion(packageName: string, registry: string) {
  const response = await axios.get(`${registry}/${packageName}`);
  const data = response.data;
  const latestVersion = data['dist-tags'].latest;
  return latestVersion;
}

/**
 * download and unzip to node_modules
 */
export async function downloadAndUnzipToNodeModules(fileUrl: string) {
  const fileName = path.basename(fileUrl).slice(0, -path.extname(fileUrl).length);
  const tempDir = await getTempDir(fileName);

  // download and unzip to temp dir
  await fs.remove(tempDir);
  await download(fileUrl, tempDir, { extract: true });

  const packageJson = require(path.join(tempDir, 'package.json'));
  const packageDir = getStoragePluginDir(packageJson.name);

  // move to plugin storage dir
  await fs.remove(packageDir);
  await fs.move(path.join(tempDir, 'package'), packageDir, { overwrite: true });

  // symlink to node_modules
  const nodeModulesPluginDir = getNodeModulesPluginDir(packageJson.name);
  if (!(await fs.pathExists(nodeModulesPluginDir))) {
    await fs.symlink(packageDir, nodeModulesPluginDir);
  }

  // remove temp dir
  await fs.remove(tempDir);

  return {
    name: packageJson.name,
    version: packageJson.version,
    packageDir,
  };
}

export async function addByLocalPackage(packageDir: string) {
  const { name } = getPackageJsonByLocalPath(packageDir);
  // symlink to storage dir
  const packageStorageDir = getStoragePluginDir(name);
  if (!(await fs.pathExists(packageStorageDir))) {
    await fs.symlink(packageDir, packageStorageDir);
  }

  // symlink to node_modules
  const nodeModulesPluginDir = getNodeModulesPluginDir(name);
  if (!(await fs.pathExists(nodeModulesPluginDir))) {
    await fs.symlink(packageDir, nodeModulesPluginDir);
  }
}

/**
 * get package info from npm
 *
 * @example
 * getPluginInfoByNpm('dayjs', 'https://registry.npmjs.org')
 * => { fileUrl: 'https://registry.npmjs.org/dayjs/-/dayjs-1.10.6.tgz', latestVersion: '1.10.6' }
 *
 * getPluginInfoByNpm('dayjs', 'https://registry.npmjs.org', '1.1.0')
 * => { fileUrl: 'https://registry.npmjs.org/dayjs/-/dayjs-1.1.0.tgz', latestVersion: '1.1.0' }
 */
export async function getPluginInfoByNpm(packageName: string, registry: string, version?: string) {
  if (registry.endsWith('/')) {
    registry = registry.slice(0, -1);
  }
  if (!version) {
    version = await getLatestVersion(packageName, registry);
  }

  const fileUrl = `${registry}/${packageName}/-/${packageName.split('/').pop()}-${version}.tgz`;

  return { fileUrl, version };
}

/**
 * scan `src/server` directory to get server packages
 *
 * @example
 * getServerPackages('src/server') => ['dayjs', '@nocobase/plugin-bbb']
 */
export function getServerPackages(packageDir: string) {
  function isBuiltinModule(packageName: string) {
    return builtinModules.includes(packageName);
  }

  function getSrcPlugins(sourceDir: string): string[] {
    const importedPlugins = new Set<string>();
    const exts = ['.js', '.ts', '.jsx', '.tsx'];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"\s.].+?)['"];?/g;
    const requireRegex = /require\s*\(\s*[`'"]([^`'"\s.].+?)[`'"]\s*\)/g;
    function setPluginsFromContent(reg: RegExp, content: string) {
      let match: RegExpExecArray | null;
      while ((match = reg.exec(content))) {
        let importedPlugin = match[1];
        if (importedPlugin.startsWith('@')) {
          // @aa/bb/ccFile => @aa/bb
          importedPlugin = importedPlugin.split('/').slice(0, 2).join('/');
        } else {
          // aa/bbFile => aa
          importedPlugin = importedPlugin.split('/')[0];
        }

        if (!isBuiltinModule(importedPlugin)) {
          importedPlugins.add(importedPlugin);
        }
      }
    }

    function traverseDirectory(directory: string) {
      const files = fs.readdirSync(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // recursive
          traverseDirectory(filePath);
        } else if (stat.isFile() && !filePath.includes('__tests__')) {
          if (exts.includes(path.extname(filePath).toLowerCase())) {
            const content = fs.readFileSync(filePath, 'utf-8');

            setPluginsFromContent(importRegex, content);
            setPluginsFromContent(requireRegex, content);
          }
        }
      }
    }

    traverseDirectory(sourceDir);

    return [...importedPlugins];
  }

  const srcServerPlugins = getSrcPlugins(path.join(packageDir, 'src/server'));
  return srcServerPlugins;
}

/**
 * remove devDependencies & adjust dependencies
 */
export async function adjustPluginJson(packageDir: string) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  const packageJson = require(packageJsonPath);
  const serverPlugins = getServerPackages(packageDir);
  const dependencies: Record<string, string> = packageJson.dependencies || {};
  const serverDependencies = Object.keys(dependencies).reduce<Record<string, string>>((result, packageName) => {
    if (serverPlugins.includes(packageName)) {
      result[packageName] = dependencies[packageName];
    }
    return result;
  }, {});

  fs.writeJSON(
    packageJsonPath,
    {
      ...packageJson,
      dependencies: serverDependencies,
      devDependencies: {},
    },
    { spaces: 2 },
  );

  return !!Object.keys(serverDependencies).length;
}

// /**
//  * install dependencies
//  */
// export async function installPlugin(packageDir: string) {
//   const shouldInstall = await adjustPluginJson(packageDir);

//   if (shouldInstall) {
//     try {
//       await $({
//         stdio: 'inherit',
//         shell: true,
//         cwd: packageDir,
//       })`yarn install --registry=http://registry.npmmirror.com`;
//     } catch {
//       await $({ stdio: 'inherit', shell: true, cwd: packageDir })`yarn install`;
//     }
//   }
// }

export function removePluginPackage(packageName: string) {
  const packageDir = getStoragePluginDir(packageName);
  const nodeModulesPluginDir = getNodeModulesPluginDir(packageName);
  return Promise.all([fs.remove(packageDir), fs.remove(nodeModulesPluginDir)]);
}

export async function checkPluginExist(packageName: string) {
  const packageDir = getStoragePluginDir(packageName);
  const nodeModulesPluginDir = getNodeModulesPluginDir(packageName);

  const packageDirExists = await fs.exists(packageDir);
  const nodeModulesPluginDirExists = await fs.exists(nodeModulesPluginDir);

  // if packageDir exists and nodeModulesPluginDir not exists, create symlink
  if (packageDirExists && !nodeModulesPluginDirExists) {
    fs.symlink(packageDir, nodeModulesPluginDir);
  }

  return packageDirExists;
}

export function getClientStaticUrl(packageName: string) {
  return `/api/plugins/${packageName}/index.js`;
}

export function getClientReadmeUrl(packageName: string) {
  return `/api/plugins/${packageName}/README.md`;
}

export function getChangelogUrl(packageName: string) {
  return `/api/plugins/${packageName}/CHANGELOG.md`;
}

/**
 * check whether the url is match client static url
 * @example
 * isMatchClientStaticUrl('/plugins/dayjs/index.js') => true
 * isMatchClientStaticUrl('/api/xx') => false
 */
export function isMatchClientStaticUrl(url: string) {
  return url.startsWith('/plugins/');
}

/**
 * get client static real path
 *
 * @example
 * getClientStaticRealPath('dayjs', 'http://xxx/plugins/dayjs/index.js') => '/Users/xxx/xx/dayjs/lib/client/index.js'
 * getClientStaticRealPath('dayjs', 'http://xxx/plugins/dayjs/js/a17ae.js') => '/Users/xxx/xx/dayjs/lib/client/js/a17ae.js' // lazy import
 * getClientStaticRealPath('dayjs', 'http://xxx/plugins/dayjs/readme.md') => '/Users/xxx/xx/dayjs/README.md'
 */
export function getClientStaticRealPath(pathname: string) {
  const packageName = getPluginNameByClientStaticUrl(pathname);
  const packageDir = getStoragePluginDir(packageName);
  const filePath = pathname.replace('/plugins/', '').replace(packageName, '');
  if (path.extname(pathname).toLocaleLowerCase() === '.md') {
    return path.join(packageDir, filePath);
  }
  return path.join(packageDir, 'lib', 'client', filePath);
}

/**
 * get package.json
 *
 * @example
 * getPackageJson('dayjs') => { name: 'dayjs', version: '1.0.0', ... }
 */
export function getPackageJson(pluginName: string) {
  const packageDir = getStoragePluginDir(pluginName);
  return getPackageJsonByLocalPath(packageDir);
}

export function getPackageJsonByLocalPath(localPath: string) {
  if (!fs.existsSync(localPath)) {
    return null;
  } else {
    return require(path.join(localPath, 'package.json'));
  }
}

/**
 * get package name by client static url
 *
 * @example
 * getPluginNameByClientStaticUrl('/plugins/dayjs/index.js') => 'dayjs'
 * getPluginNameByClientStaticUrl('/plugins/@nocobase/foo/README.md') => '@nocobase/foo'
 */
export function getPluginNameByClientStaticUrl(pathname: string) {
  pathname = pathname.replace('/plugins/', '');
  const pathArr = pathname.split('/');
  if (pathname.startsWith('@')) {
    return pathArr.slice(0, 2).join('/');
  }
  return pathArr[0];
}

export async function addOrUpdatePluginByNpm(
  options: Pick<PluginData, 'name' | 'registry' | 'version'>,
  update?: boolean,
) {
  const exists = await checkPluginExist(options.name);
  if (exists && !update) {
    return getPackageJson(options.name);
  }
  const { fileUrl, version } = await getPluginInfoByNpm(options.name, options.registry, options.version);
  await downloadAndUnzipToNodeModules(fileUrl);

  return {
    version,
  };
}

export async function addOrUpdatePluginByZip(options: Partial<Pick<PluginData, 'zipUrl' | 'name'>>, update?: boolean) {
  const { name, version, packageDir } = await downloadAndUnzipToNodeModules(options.zipUrl);

  if (options.name && options.name !== name) {
    throw new Error(`Plugin name in package.json must be ${options.name}, but got ${name}`);
  }

  return {
    name,
    packageDir,
    version,
  };
}

/**
 * reinstall package when reinstall app or other situation
 */
export async function checkPluginPackage(plugin: PluginData) {
  // 1. check plugin exist
  if (!(await checkPluginExist(plugin.name))) {
    if (plugin.registry) {
      // 2. update plugin by npm
      return addOrUpdatePluginByNpm(
        {
          name: plugin.name,
          registry: plugin.registry,
          version: plugin.version,
        },
        true,
      );
    } else if (plugin.zipUrl) {
      // 3. update plugin by zip
      return addOrUpdatePluginByZip(plugin);
    }
  }
}

export async function getNewVersion(plugin: PluginData): Promise<string | false> {
  if (!plugin.name || !plugin.registry) return false;

  // 1. Check plugin version by npm registry
  const { version } = await getPluginInfoByNpm(plugin.name, plugin.registry);
  // 2. has new version, return true
  return version !== plugin.version ? version : false;
}

export async function getExtraPluginInfo(plugin: PluginData) {
  const packageJson = getPackageJson(plugin.name);
  if (!packageJson) return undefined;
  const newVersion = getNewVersion(plugin);
  return {
    packageJson,
    serverVersion: version,
    newVersion,
    clientUrl: getClientStaticUrl(plugin.name),
    readmeUrl: getClientReadmeUrl(plugin.name),
    changelogUrl: getChangelogUrl(plugin.name),
  };
}
