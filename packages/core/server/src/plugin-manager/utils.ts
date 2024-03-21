import { importModule, isURL } from '@nocobase/utils';
import { createStoragePluginSymLink } from '@nocobase/utils/plugin-symlink';
import axios, { AxiosRequestConfig } from 'axios';
import decompress from 'decompress';
import fg from 'fast-glob';
import fs from 'fs-extra';
import ini from 'ini';
import { builtinModules } from 'module';
import os from 'os';
import path from 'path';
import semver from 'semver';
import { getDepPkgPath, getPackageDir, getPackageFilePathWithExistCheck } from './clientStaticUtils';
import {
  APP_NAME,
  DEFAULT_PLUGIN_PATH,
  DEFAULT_PLUGIN_STORAGE_PATH,
  EXTERNAL,
  importRegex,
  pluginPrefix,
  requireRegex,
} from './constants';
import deps from './deps';
import { PluginData } from './types';

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
  return path.join(process.env.NODE_MODULES_PATH, packageName);
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
  const npmInfo = await getNpmInfo(packageName, registry, token);
  const latestVersion = npmInfo['dist-tags'].latest;
  return latestVersion;
}

export async function getNpmInfo(packageName: string, registry: string, token?: string) {
  registry.endsWith('/') && (registry = registry.slice(0, -1));
  const response = await axios.get(`${registry}/${packageName}`, {
    headers: getAuthorizationHeaders(registry, token),
  });
  try {
    const data = response.data;
    return data;
  } catch (e) {
    console.error(e);
    throw new Error(`${registry} is not a valid registry, '${registry}/${packageName}' response is not a valid json.`);
  }
}

export async function download(url: string, destination: string, options: AxiosRequestConfig = {}) {
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

  if (isURL(fileUrl)) {
    await download(fileUrl, tempFile, {
      headers: getAuthorizationHeaders(fileUrl, authToken),
    });
  } else if (await fs.exists(fileUrl)) {
    await fs.copy(fileUrl, tempFile);
  } else {
    throw new Error(`${fileUrl} does not exist`);
  }

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

  const packageJson = await readJSONFileContent(packageJsonPath);
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
  await createStoragePluginSymLink(packageName);

  // remove temp dir
  await removeTmpDir(tempFile, tempPackageContentDir);

  return {
    packageDir,
  };
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

/**
 * get package.json
 *
 * @example
 * getPackageJson('dayjs') => { name: 'dayjs', version: '1.0.0', ... }
 */
export async function getPackageJson(pluginName: string) {
  const packageDir = getStoragePluginDir(pluginName);
  return await getPackageJsonByLocalPath(packageDir);
}

export async function getPackageJsonByLocalPath(localPath: string) {
  if (!fs.existsSync(localPath)) {
    return null;
  } else {
    const fullPath = path.join(localPath, 'package.json');
    const data = await fs.promises.readFile(fullPath, { encoding: 'utf-8' });
    return JSON.parse(data);
  }
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

export async function requireNoCache(fileOrPackageName: string) {
  return await importModule(fileOrPackageName);
}

export async function readJSONFileContent(filePath: string) {
  const data = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
  return JSON.parse(data);
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

async function getExternalVersionFromDistFile(packageName: string): Promise<false | Record<string, string>> {
  const { exists, filePath } = getPackageFilePathWithExistCheck(packageName, 'dist/externalVersion.js');
  if (!exists) {
    return false;
  }

  try {
    return await requireNoCache(filePath);
  } catch (e) {
    console.error(e);
    return false;
  }
}
export function isNotBuiltinModule(packageName: string) {
  return !builtinModules.includes(packageName);
}

export const isValidPackageName = (str: string) => {
  const pattern = /^(?:@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/;
  return pattern.test(str);
};

export function getPackageNameFromString(str: string) {
  // ./xx or ../xx
  if (str.startsWith('.')) return null;

  const arr = str.split('/');
  let packageName: string;
  if (arr[0].startsWith('@')) {
    // @aa/bb/ccFile => @aa/bb
    packageName = arr.slice(0, 2).join('/');
  } else {
    // aa/bbFile => aa
    packageName = arr[0];
  }

  packageName = packageName.trim();

  return isValidPackageName(packageName) ? packageName : null;
}

export function getPackagesFromFiles(files: string[]): string[] {
  const packageNames = files
    .map((item) => [
      ...[...item.matchAll(importRegex)].map((item) => item[2]),
      ...[...item.matchAll(requireRegex)].map((item) => item[1]),
    ])
    .flat()
    .map(getPackageNameFromString)
    .filter(Boolean)
    .filter(isNotBuiltinModule);

  return [...new Set(packageNames)];
}

export function getIncludePackages(sourcePackages: string[], external: string[], pluginPrefix: string[]): string[] {
  return sourcePackages
    .filter((packageName) => !external.includes(packageName)) // exclude external
    .filter((packageName) => !pluginPrefix.some((prefix) => packageName.startsWith(prefix))); // exclude other plugin
}

export function getExcludePackages(sourcePackages: string[], external: string[], pluginPrefix: string[]): string[] {
  const includePackages = getIncludePackages(sourcePackages, external, pluginPrefix);
  return sourcePackages.filter((packageName) => !includePackages.includes(packageName));
}

export async function getExternalVersionFromSource(packageName: string) {
  const packageDir = getPackageDir(packageName);
  const sourceGlobalFiles: string[] = ['src/**/*.{ts,js,tsx,jsx}', '!src/**/__tests__'];
  const sourceFilePaths = await fg.glob(sourceGlobalFiles, { cwd: packageDir, absolute: true });
  const sourceFiles = await Promise.all(sourceFilePaths.map((item) => fs.readFile(item, 'utf-8')));
  const sourcePackages = getPackagesFromFiles(sourceFiles);
  const excludePackages = getExcludePackages(sourcePackages, EXTERNAL, pluginPrefix);
  const data = excludePackages.reduce<Record<string, string>>((prev, packageName) => {
    const depPkgPath = getDepPkgPath(packageName, packageDir);
    const depPkg = require(depPkgPath);
    prev[packageName] = depPkg.version;
    return prev;
  }, {});
  return data;
}

export interface DepCompatible {
  name: string;
  result: boolean;
  versionRange: string;
  packageVersion: string;
}
export async function getCompatible(packageName: string) {
  let externalVersion: Record<string, string>;
  if (!process.env.IS_DEV_CMD) {
    const res = await getExternalVersionFromDistFile(packageName);
    if (!res) {
      return false;
    } else {
      externalVersion = res;
    }
  } else {
    externalVersion = await getExternalVersionFromSource(packageName);
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

export async function checkCompatible(packageName: string) {
  const compatible = await getCompatible(packageName);
  if (!compatible) return false;
  return compatible.every((item) => item.result);
}

export async function checkAndGetCompatible(packageName: string) {
  const compatible = await getCompatible(packageName);
  if (!compatible) {
    return {
      isCompatible: false,
      depsCompatible: [],
    };
  }
  return {
    isCompatible: compatible.every((item) => item.result),
    depsCompatible: compatible,
  };
}
