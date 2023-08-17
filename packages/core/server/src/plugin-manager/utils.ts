import axios, { Axios, AxiosRequestConfig } from 'axios';
import decompress from 'decompress';
import fs from 'fs-extra';
import semver from 'semver';
import ini from 'ini';
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
 * getTempDir() => '/tmp/nocobase'
 */
export async function getTempDir() {
  const temporaryDirectory = await fs.realpath(os.tmpdir());
  return path.join(temporaryDirectory, APP_NAME);
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

export function getAuthorizationHeaders(registry?: string, authToken?: string) {
  const headers = {};
  if (registry && !authToken) {
    const npmrcPath = path.join(process.cwd(), '.npmrc');
    const url = new URL(registry);
    let envConfig: Record<string, string> = process.env;
    if (fs.existsSync(npmrcPath)) {
      const content = fs.readFileSync(path.join(process.cwd(), '.npmrc'), 'utf-8');
      envConfig = {
        ...envConfig,
        ...ini.parse(content),
      };
    }
    const key = Object.keys(envConfig).find((key) => key.includes(url.host) && key.includes('_authToken'));
    if (key) {
      authToken = envConfig[key];
    }
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

/**
 * get latest version from npm
 *
 * @example
 * getLatestVersion('dayjs', 'https://registry.npmjs.org') => '1.10.6'
 */
export async function getLatestVersion(packageName: string, registry: string, token?: string) {
  const response = await axios.get(`${registry}/${packageName}`, {
    headers: getAuthorizationHeaders(registry, token),
  });
  try {
    const data = response.data;
    const latestVersion = data['dist-tags'].latest;
    return latestVersion;
  } catch (e) {
    console.error(e);
    throw new Error(`${registry} is not a valid registry, '${registry}/${packageName}' response is not a valid json.`);
  }
}

export async function download(url: string, destination: string, options: AxiosRequestConfig = {}) {
  url = url.replace('localhost', '127.0.0.1');
  const response = await axios.get(url, {
    ...options,
    responseType: 'stream',
  });

  fs.mkdirpSync(path.dirname(destination));
  const writer = fs.createWriteStream(destination);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export async function removeTmpDir(tempFile: string, tempPackageContentDir: string) {
  await fs.remove(tempFile);
  await fs.remove(tempPackageContentDir);
}

/**
 * download and unzip to node_modules
 */
export async function downloadAndUnzipToTempDir(fileUrl: string, authToken?: string) {
  const fileName = path.basename(fileUrl);
  const tempDir = await getTempDir();
  const tempFile = path.join(tempDir, fileName);
  const tempPackageDir = tempFile.replace(path.extname(fileName), '');

  // download and unzip to temp dir
  await fs.remove(tempPackageDir);
  await fs.remove(tempFile);

  await download(fileUrl, tempFile, {
    headers: getAuthorizationHeaders(fileUrl, authToken),
  });

  if (!fs.existsSync(tempFile)) {
    throw new Error(`download ${fileUrl} failed`);
  }

  await decompress(tempFile, tempPackageDir);

  if (!fs.existsSync(tempPackageDir)) {
    await fs.remove(tempFile);
    throw new Error(`File is not a valid compressed file. Maybe the file need authorization.`);
  }

  let tempPackageContentDir = tempPackageDir;
  const files = fs
    .readdirSync(tempPackageDir, { recursive: false, withFileTypes: true })
    .filter((item) => item.name !== '__MACOSX');
  if (
    files.length === 1 &&
    files[0].isDirectory() &&
    fs.existsSync(path.join(tempPackageDir, files[0]['name'], 'package.json'))
  ) {
    tempPackageContentDir = path.join(tempPackageDir, files[0]['name']);
  }
  const packageJsonPath = path.join(tempPackageContentDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    await removeTmpDir(tempFile, tempPackageContentDir);
    throw new Error(`decompress ${fileUrl} failed`);
  }

  const packageJson = requireNoCache(packageJsonPath);
  const mainFile = path.join(tempPackageContentDir, packageJson.main);
  if (!fs.existsSync(mainFile)) {
    await removeTmpDir(tempFile, tempPackageContentDir);
    throw new Error(`main file ${packageJson.main} not found, Please check if the plugin has been built.`);
  }

  return {
    packageName: packageJson.name,
    version: packageJson.version,
    tempPackageContentDir,
    tempFile,
  };
}

export async function copyTempPackageToStorageAndLinkToNodeModules(
  tempFile: string,
  tempPackageContentDir: string,
  packageName: string,
) {
  const packageDir = getStoragePluginDir(packageName);

  // move to plugin storage dir
  await fs.remove(packageDir);
  await fs.move(tempPackageContentDir, packageDir, { overwrite: true });

  // symlink to node_modules
  await linkToNodeModules(packageName, packageDir);

  // remove temp dir
  await removeTmpDir(tempFile, tempPackageContentDir);

  return {
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

interface GetPluginInfoOptions {
  packageName: string;
  registry: string;
  version?: string;
  authToken?: string;
}

export async function getPluginInfoByNpm(options: GetPluginInfoOptions) {
  let { registry, version } = options;
  const { packageName, authToken } = options;
  if (registry.endsWith('/')) {
    registry = registry.slice(0, -1);
  }
  if (!version) {
    version = await getLatestVersion(packageName, registry, authToken);
  }

  const compressedFileUrl = `${registry}/${packageName}/-/${packageName.split('/').pop()}-${version}.tgz`;

  return { compressedFileUrl, version };
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
    return requireNoCache(path.join(localPath, 'package.json'));
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

export async function updatePluginByCompressedFileUrl(
  options: Partial<Pick<PluginData, 'compressedFileUrl' | 'packageName' | 'authToken'>>,
) {
  const { packageName, version, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(
    options.compressedFileUrl,
    options.authToken,
  );

  if (options.packageName && options.packageName !== packageName) {
    await removeTmpDir(tempFile, tempPackageContentDir);
    throw new Error(`Plugin name in package.json must be ${options.packageName}, but got ${packageName}`);
  }

  const { packageDir } = await copyTempPackageToStorageAndLinkToNodeModules(
    tempFile,
    tempPackageContentDir,
    packageName,
  );

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
  if (plugin.type && !(await checkPluginExist(plugin))) {
    await updatePluginByCompressedFileUrl(plugin);
  }
}

export async function getNewVersion(plugin: PluginData): Promise<string | false> {
  if (!(plugin.packageName && plugin.registry)) return false;

  // 1. Check plugin version by npm registry
  const { version } = await getPluginInfoByNpm({
    packageName: plugin.packageName,
    registry: plugin.registry,
    authToken: plugin.authToken,
  });
  // 2. has new version, return true
  return version !== plugin.version ? version : false;
}

export function removeRequireCache(fileOrPackageName: string) {
  delete require.cache[require.resolve(fileOrPackageName)];
  delete require.cache[fileOrPackageName];
}

export function requireNoCache(fileOrPackageName: string) {
  removeRequireCache(fileOrPackageName);
  return require(fileOrPackageName);
}

export function requireModule(m: any) {
  if (typeof m === 'string') {
    m = require(m);
  }
  if (typeof m !== 'object') {
    return m;
  }
  return m.__esModule ? m.default : m;
}

export interface DepCompatible {
  name: string;
  result: boolean;
  versionRange: string;
  packageVersion: string;
}
export function getCompatible(packageName: string) {
  const realPath = getRealPath(packageName, 'dist/externalVersion.js');

  const exists = fs.existsSync(realPath);
  if (!exists) {
    return false;
  }

  let externalVersion: Record<string, string>;
  try {
    externalVersion = requireNoCache(realPath);
  } catch (e) {
    console.error(e);
    return false;
  }
  return Object.keys(externalVersion).reduce<DepCompatible[]>((result, packageName) => {
    const packageVersion = externalVersion[packageName];
    const globalPackageName = deps[packageName]
      ? packageName
      : deps[packageName.split('/')[0]] // @nocobase and @formily
      ? packageName.split('/')[0]
      : undefined;

    if (globalPackageName) {
      const versionRange = deps[globalPackageName];
      result.push({
        name: packageName,
        result: semver.satisfies(packageVersion, versionRange, { includePrerelease: true }),
        versionRange,
        packageVersion,
      });
    }
    return result;
  }, []);
}

export function checkCompatible(packageName: string) {
  const compatible = getCompatible(packageName);
  if (!compatible) return false;
  return compatible.every((item) => item.result);
}
