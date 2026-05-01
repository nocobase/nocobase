/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { access, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';
import tar from 'tar';
import type { ManagedAppRuntime } from '../../../lib/app-runtime.js';
import {
  createStoragePluginsSymlink,
  removeStoragePluginSymlink,
  resolvePluginStoragePath,
} from '../../../lib/plugin-storage.js';
import {
  parseLicenseKey,
  readSavedLicenseKey,
  resolveLicensePkgUrl,
  type LicenseKeyData,
} from '../shared.js';

export type LicensedPluginPackages = {
  commercialPlugins: string[];
  licensedPlugins: string[];
};

export type LicensePluginSyncResult = {
  commercialPlugins: string[];
  licensedPlugins: string[];
  installed: string[];
  updated: string[];
  removed: string[];
  skipped: string[];
  warnings: string[];
  storagePath: string;
  details: Array<{
    packageName: string;
    action: 'installed' | 'updated' | 'removed' | 'skipped';
    outputDir: string;
    warning?: string;
  }>;
};

export type LicensePluginSyncDetail = LicensePluginSyncResult['details'][number];

export type LicensePluginCleanResult = {
  commercialPlugins: string[];
  removed: string[];
  skipped: string[];
  storagePath: string;
  details: Array<{
    packageName: string;
    action: 'removed' | 'skipped';
    outputDir: string;
    removedSymlink: boolean;
  }>;
};

export type LicensePluginCleanDetail = LicensePluginCleanResult['details'][number];

function resolvePkgBaseUrl(pkgUrl?: string): string {
  return resolveLicensePkgUrl(pkgUrl);
}

function responseBodyToNodeReadable(body: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(body as unknown as NodeReadableStream);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function loginPkg(baseURL: string, keyData: LicenseKeyData): Promise<string> {
  const username = String(keyData.accessKeyId ?? '').trim();
  const password = String(keyData.accessKeySecret ?? '').trim();
  if (!username || !password) {
    throw new Error('The saved license key does not include package registry credentials.');
  }

  const response = await fetch(`${baseURL}-/verdaccio/sec/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Package registry login failed with status ${response.status}.`);
  }
  const data = await response.json();
  const token = String(data?.token ?? '').trim();
  if (!token) {
    throw new Error('Package registry login did not return a token.');
  }
  return token;
}

export async function loadSavedLicenseKeyData(runtime: ManagedAppRuntime): Promise<LicenseKeyData> {
  const licenseKey = await readSavedLicenseKey(runtime);
  if (!licenseKey) {
    throw new Error(`No saved license key was found for env "${runtime.envName}". Run \`nb license activate\` first.`);
  }
  return parseLicenseKey(licenseKey);
}

export async function fetchLicensedPluginPackages(
  runtime: ManagedAppRuntime,
  options: {
    pkgUrl?: string;
  } = {},
): Promise<LicensedPluginPackages> {
  const keyData = await loadSavedLicenseKeyData(runtime);
  const baseURL = resolvePkgBaseUrl(options.pkgUrl);
  const token = await loginPkg(baseURL, keyData);
  const response = await fetch(`${baseURL}pro-packages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch commercial plugins with status ${response.status}.`);
  }
  const rawData = await response.json();

  if (Array.isArray(rawData)) {
    return {
      commercialPlugins: rawData,
      licensedPlugins: rawData,
    };
  }

  return {
    commercialPlugins: rawData?.meta?.commercial_plugins || [],
    licensedPlugins: rawData?.data || [],
  };
}

async function isDownloaded(pluginName: string, storagePath: string, version?: string): Promise<boolean> {
  const packageFile = path.resolve(storagePath, pluginName, 'package.json');
  if (!(await pathExists(packageFile))) {
    return false;
  }
  if (!version) {
    return true;
  }
  const json = JSON.parse(await readFile(packageFile, 'utf8'));
  return String(json.version ?? '').trim() === version;
}

async function isDevPackage(pluginName: string): Promise<boolean> {
  const candidates = [
    path.resolve(process.cwd(), 'packages/plugins', pluginName, 'package.json'),
    path.resolve(process.cwd(), 'packages/pro-plugins', pluginName, 'package.json'),
  ];
  for (const filePath of candidates) {
    if (await pathExists(filePath)) {
      return true;
    }
  }
  return false;
}

async function isDependencyPackage(
  pluginName: string,
  storagePath: string,
  nodeModulesPath: string,
): Promise<boolean> {
  if (!nodeModulesPath) {
    return false;
  }

  const packageJsonInNodeModules = path.resolve(nodeModulesPath, pluginName, 'package.json');
  const packageJsonInStorage = path.resolve(storagePath, pluginName, 'package.json');
  if (!(await pathExists(packageJsonInNodeModules)) || !(await pathExists(packageJsonInStorage))) {
    return false;
  }
  const realNodeModulesPath = await realpath(packageJsonInNodeModules);
  const realStoragePath = await realpath(packageJsonInStorage);
  return realNodeModulesPath !== realStoragePath;
}

async function packageMetadata(baseURL: string, token: string, pluginName: string): Promise<any | undefined> {
  try {
    const response = await fetch(`${baseURL}${pluginName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return undefined;
    }
    return await response.json();
  } catch {
    return undefined;
  }
}

function resolveTarball(metadata: any, requestedVersion: string): [string, string] | undefined {
  if (metadata.versions?.[requestedVersion]) {
    return [requestedVersion, metadata.versions[requestedVersion].dist.tarball];
  }

  let version = requestedVersion;
  if (version.includes('rc')) {
    version = version.split('-').shift() || version;
  }

  const keys = version.split('.');
  if (keys.length === 5) {
    keys.pop();
    version = keys.join('.');
  }

  if (version === 'latest') {
    version = metadata['dist-tags']?.latest;
  } else if (version === 'next') {
    version = metadata['dist-tags']?.next;
  } else if (requestedVersion.includes('beta')) {
    version = metadata['dist-tags']?.next;
  } else if (requestedVersion.includes('alpha')) {
    version = metadata['dist-tags']?.alpha || metadata['dist-tags']?.next;
  }

  if (!metadata.versions?.[version]) {
    return undefined;
  }

  return [version, metadata.versions[version].dist.tarball];
}

async function downloadPlugin(
  baseURL: string,
  token: string,
  pluginName: string,
  requestedVersion: string,
  storagePath: string,
  nodeModulesPath: string,
): Promise<{ action: 'installed' | 'updated' | 'skipped'; warning?: string }> {
  if (await isDevPackage(pluginName)) {
    return { action: 'skipped' };
  }
  if (await isDependencyPackage(pluginName, storagePath, nodeModulesPath)) {
    return { action: 'skipped' };
  }

  const metadata = await packageMetadata(baseURL, token, pluginName);
  if (!metadata) {
    return {
      action: 'skipped',
      warning: `Commercial plugin package "${pluginName}" does not exist in the package registry.`,
    };
  }

  const tarball = resolveTarball(metadata, requestedVersion);
  if (!tarball) {
    return {
      action: 'skipped',
      warning: `Package ${pluginName} does not have a downloadable version for "${requestedVersion}".`,
    };
  }

  const [resolvedVersion, tarballUrl] = tarball;
  if (await isDownloaded(pluginName, storagePath, resolvedVersion)) {
    return { action: 'skipped' };
  }

  const outputDir = path.resolve(storagePath, pluginName);
  const existedBefore = await pathExists(path.resolve(storagePath, pluginName, 'package.json'));
  try {
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const response = await fetch(tarballUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`download failed with status ${response.status}`);
    }
    if (!response.body) {
      throw new Error('download response body is empty');
    }

    await new Promise<void>((resolve, reject) => {
      responseBodyToNodeReadable(response.body)
        .pipe(createGunzip())
        .pipe(tar.extract({ cwd: outputDir, strip: 1 }))
        .on('finish', () => resolve())
        .on('error', reject);
    });

    return {
      action: existedBefore ? 'updated' : 'installed',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      action: 'skipped',
      warning: `Failed to download ${pluginName}@${resolvedVersion} from ${tarballUrl}: ${message}`,
    };
  }
}

async function removeUnlicensedPlugin(pluginName: string, storagePath: string): Promise<boolean> {
  const dir = path.resolve(storagePath, pluginName);
  if (!(await pathExists(dir))) {
    return false;
  }
  await rm(dir, { recursive: true, force: true });
  return true;
}

async function removeDownloadedPlugin(pluginName: string, storagePath: string): Promise<boolean> {
  const dir = path.resolve(storagePath, pluginName);
  if (!(await pathExists(dir))) {
    return false;
  }
  await rm(dir, { recursive: true, force: true });
  return true;
}

export async function syncLicensedPlugins(
  runtime: ManagedAppRuntime,
  options: {
    pkgUrl?: string;
    version: string;
    dryRun?: boolean;
    onProgress?: (detail: LicensePluginSyncDetail) => void | Promise<void>;
  },
): Promise<LicensePluginSyncResult> {
  const keyData = await loadSavedLicenseKeyData(runtime);
  const baseURL = resolvePkgBaseUrl(options.pkgUrl);
  const token = await loginPkg(baseURL, keyData);
  const { commercialPlugins, licensedPlugins } = await fetchLicensedPluginPackages(runtime, { pkgUrl: options.pkgUrl });

  const storagePath = resolvePluginStoragePath(runtime.env.storagePath);
  const nodeModulesPath = String(runtime.env.envVars.NODE_MODULES_PATH ?? '').trim();
  const result: LicensePluginSyncResult = {
    commercialPlugins,
    licensedPlugins,
    installed: [],
    updated: [],
    removed: [],
    skipped: [],
    warnings: [],
    storagePath,
    details: [],
  };

  const emitDetail = async (detail: LicensePluginSyncDetail) => {
    result.details.push(detail);
    await options.onProgress?.(detail);
  };

  for (const pluginName of commercialPlugins) {
    if (!licensedPlugins.includes(pluginName)) {
      if (options.dryRun) {
        result.removed.push(pluginName);
        await emitDetail({
          packageName: pluginName,
          action: 'removed',
          outputDir: path.resolve(storagePath, pluginName),
        });
        continue;
      }
      if (await removeUnlicensedPlugin(pluginName, storagePath)) {
        result.removed.push(pluginName);
        await emitDetail({
          packageName: pluginName,
          action: 'removed',
          outputDir: path.resolve(storagePath, pluginName),
        });
      }
    }
  }

  for (const pluginName of licensedPlugins) {
    if (options.dryRun) {
      if (await isDownloaded(pluginName, storagePath, options.version)) {
        result.skipped.push(pluginName);
        await emitDetail({
          packageName: pluginName,
          action: 'skipped',
          outputDir: path.resolve(storagePath, pluginName),
        });
      } else {
        result.installed.push(pluginName);
        await emitDetail({
          packageName: pluginName,
          action: 'installed',
          outputDir: path.resolve(storagePath, pluginName),
        });
      }
      continue;
    }

    const { action, warning } = await downloadPlugin(
      baseURL,
      token,
      pluginName,
      options.version,
      storagePath,
      nodeModulesPath,
    );
    if (warning) {
      result.warnings.push(warning);
    }
    if (action === 'installed') {
      result.installed.push(pluginName);
    } else if (action === 'updated') {
      result.updated.push(pluginName);
    } else {
      result.skipped.push(pluginName);
    }
    await emitDetail({
      packageName: pluginName,
      action,
      outputDir: path.resolve(storagePath, pluginName),
      ...(warning ? { warning } : {}),
    });
  }

  if (!options.dryRun) {
    await createStoragePluginsSymlink(runtime.env.storagePath, nodeModulesPath);
  }

  return result;
}

export async function cleanLicensedPlugins(
  runtime: ManagedAppRuntime,
  options: {
    pkgUrl?: string;
    dryRun?: boolean;
    onProgress?: (detail: LicensePluginCleanDetail) => void | Promise<void>;
  } = {},
): Promise<LicensePluginCleanResult> {
  const { commercialPlugins } = await fetchLicensedPluginPackages(runtime, { pkgUrl: options.pkgUrl });
  const storagePath = resolvePluginStoragePath(runtime.env.storagePath);
  const nodeModulesPath = String(runtime.env.envVars.NODE_MODULES_PATH ?? '').trim();
  const result: LicensePluginCleanResult = {
    commercialPlugins,
    removed: [],
    skipped: [],
    storagePath,
    details: [],
  };

  const emitDetail = async (detail: LicensePluginCleanDetail) => {
    result.details.push(detail);
    await options.onProgress?.(detail);
  };

  for (const pluginName of commercialPlugins) {
    const outputDir = path.resolve(storagePath, pluginName);
    const exists = await pathExists(outputDir);

    if (!exists) {
      result.skipped.push(pluginName);
      await emitDetail({
        packageName: pluginName,
        action: 'skipped',
        outputDir,
        removedSymlink: false,
      });
      continue;
    }

    if (options.dryRun) {
      result.removed.push(pluginName);
      await emitDetail({
        packageName: pluginName,
        action: 'removed',
        outputDir,
        removedSymlink: Boolean(nodeModulesPath),
      });
      continue;
    }

    await removeDownloadedPlugin(pluginName, storagePath);
    const removedSymlink = await removeStoragePluginSymlink(pluginName, runtime.env.storagePath, nodeModulesPath);
    result.removed.push(pluginName);
    await emitDetail({
      packageName: pluginName,
      action: 'removed',
      outputDir,
      removedSymlink,
    });
  }

  return result;
}
