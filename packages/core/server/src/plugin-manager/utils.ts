import axios from 'axios';
import download from 'download';
import fs from 'fs-extra';
import semver from 'semver';
import { builtinModules } from 'module';
import os from 'os';
import path from 'path';
import { APP_NAME, DEFAULT_PLUGIN_PATH, DEFAULT_PLUGIN_STORAGE_PATH, NODE_MODULES_PATH } from './constants';
import { PluginData } from './types';
import { getRealPath } from './clientStaticMiddleware';
import deps from './deps';

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

export function getLocalPluginPackagesPathArr(): string[] {
  const pluginPackagesPathArr = process.env.PLUGIN_PATH || DEFAULT_PLUGIN_PATH;
  return pluginPackagesPathArr.split(',').map((pluginPackagesPath) => {
    pluginPackagesPath = pluginPackagesPath.trim();
    return path.isAbsolute(pluginPackagesPath) ? pluginPackagesPath : path.join(process.cwd(), pluginPackagesPath);
  });
}

export function getStoragePluginDir(packageName: string) {
  const pluginStoragePath = getPluginStoragePath();
  return path.join(pluginStoragePath, packageName);
}

export function getLocalPluginDir(packageDirBasename: string) {
  const localPluginDir = getLocalPluginPackagesPathArr()
    .map((pluginPackagesPath) => path.join(pluginPackagesPath, packageDirBasename))
    .find((pluginDir) => fs.existsSync(pluginDir));

  if (!localPluginDir) {
    throw new Error(`local plugin "${packageDirBasename}" not found`);
  }

  return localPluginDir;
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
  const fileName = path.basename(fileUrl);
  const tempDir = await getTempDir(fileName);

  // download and unzip to temp dir
  await fs.remove(tempDir);
  await download(fileUrl, tempDir, { extract: true });

  const packageJson = require(path.join(tempDir, 'package', 'package.json'));
  const packageDir = getStoragePluginDir(packageJson.name);

  // move to plugin storage dir
  await fs.remove(packageDir);
  await fs.move(path.join(tempDir, 'package'), packageDir, { overwrite: true });

  // symlink to node_modules
  await linkToNodeModules(packageJson.name, packageDir);

  // remove temp dir
  await fs.remove(tempDir);

  return {
    packageName: packageJson.name,
    version: packageJson.version,
    packageDir,
  };
}

export async function linkToNodeModules(packageName: string, from: string) {
  const nodeModulesPluginDir = getNodeModulesPluginDir(packageName);
  if (!(await fs.pathExists(nodeModulesPluginDir))) {
    if (!(await fs.pathExists(path.dirname(nodeModulesPluginDir)))) {
      await fs.mkdirp(path.dirname(nodeModulesPluginDir));
    }
    await fs.symlink(from, nodeModulesPluginDir, 'dir');
  }
}

export async function linkLocalPackageToNodeModules(packageDir: string) {
  const { name } = getPackageJsonByLocalPath(packageDir);

  // symlink to node_modules
  await linkToNodeModules(name, packageDir);
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

export async function checkPluginExist(pluginData: PluginData) {
  const { packageName, type } = pluginData;
  if (!type) return true;
  const packageDir = getStoragePluginDir(packageName);
  const exists = await fs.exists(packageDir);

  // if packageDir exists create symlink
  if (exists) {
    await linkToNodeModules(packageName, packageDir);
  }

  return exists;
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
  options: Pick<PluginData, 'packageName' | 'registry' | 'version'>,
  update?: boolean,
) {
  const exists = await checkPluginExist({ ...options, type: 'npm' });
  if (exists && !update) {
    return getPackageJson(options.packageName);
  }
  const { fileUrl, version } = await getPluginInfoByNpm(options.packageName, options.registry, options.version);
  await downloadAndUnzipToNodeModules(fileUrl);

  return {
    version,
  };
}

export async function addOrUpdatePluginByZip(
  options: Partial<Pick<PluginData, 'zipUrl' | 'packageName'>>,
  update?: boolean,
) {
  const { packageName, version, packageDir } = await downloadAndUnzipToNodeModules(options.zipUrl);

  if (options.packageName && options.packageName !== packageName) {
    throw new Error(`Plugin name in package.json must be ${options.packageName}, but got ${packageName}`);
  }

  return {
    packageName,
    packageDir,
    version,
  };
}

/**
 * reinstall package when reinstall app or other situation
 */
export async function checkPluginPackage(plugin: PluginData) {
  // 1. check plugin exist
  if (!(await checkPluginExist(plugin))) {
    if (plugin.type === 'npm') {
      return addOrUpdatePluginByNpm(
        {
          packageName: plugin.packageName,
          registry: plugin.registry,
          version: plugin.version,
        },
        true,
      );
    } else if (plugin.type === 'upload') {
      return addOrUpdatePluginByZip(plugin);
    }
  }
}

export async function getNewVersion(plugin: PluginData): Promise<string | false> {
  if (!plugin.packageName || !plugin.registry) return false;

  // 1. Check plugin version by npm registry
  const { version } = await getPluginInfoByNpm(plugin.packageName, plugin.registry);
  // 2. has new version, return true
  return version !== plugin.version ? version : false;
}

export interface DepCompatible {
  name: string;
  isCompatible: boolean;
  globalVersion: string;
  packageVersion: string;
}
export function getCompatible(packageName: string) {
  const realPath = getRealPath(packageName, 'dist/externalVersion.js');
  const exists = fs.existsSync(realPath);
  if (!exists) {
    return [];
  }
  const externalVersion = require(realPath);
  return Object.keys(externalVersion).reduce<DepCompatible[]>((result, packageName) => {
    const packageVersion = externalVersion[packageName];
    const globalPackageName = deps[packageName]
      ? packageName
      : deps[packageName.split('/')[0]] // @nocobase and @formily
      ? packageName.split('/')[0]
      : undefined;

    if (globalPackageName) {
      const globalVersion = deps[globalPackageName];
      result.push({
        name: packageName,
        isCompatible: semver.satisfies(packageVersion, globalVersion, { includePrerelease: true }),
        globalVersion,
        packageVersion,
      });
    }
    return result;
  }, []);
}

export function checkCompatible(packageName: string) {
  const compatible = getCompatible(packageName);
  return compatible.every((item) => item.isCompatible);
}
