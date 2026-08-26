import fs, { promises as fsp } from 'node:fs';
import path from 'node:path';
import type { GeneratedOperation } from './generated-command.js';
import type { CliHomeScope } from './cli-home.js';
import { resolveCliHomeDir } from './cli-home.js';

export interface StoredRuntime {
  version: string;
  schemaHash?: string;
  generatedAt: string;
  baseUrl?: string;
  commands: GeneratedOperation[];
}

export interface RuntimeStoreOptions {
  scope?: CliHomeScope;
}

function getHomeDir(options: RuntimeStoreOptions = {}) {
  return resolveCliHomeDir(options.scope);
}

export function getVersionsDir(options: RuntimeStoreOptions = {}) {
  return path.join(getHomeDir(options), 'versions');
}

export function getVersionDir(version: string, options: RuntimeStoreOptions = {}) {
  return path.join(getVersionsDir(options), version);
}

function getRuntimeFile(version: string, options: RuntimeStoreOptions = {}) {
  return path.join(getVersionDir(version, options), 'commands.json');
}

export async function saveRuntime(runtime: StoredRuntime, options: RuntimeStoreOptions = {}) {
  const versionDir = getVersionDir(runtime.version, options);
  await fsp.mkdir(versionDir, { recursive: true });
  await fsp.writeFile(getRuntimeFile(runtime.version, options), JSON.stringify(runtime, null, 2));
}

export async function loadRuntime(version: string, options: RuntimeStoreOptions = {}) {
  try {
    const content = await fsp.readFile(getRuntimeFile(version, options), 'utf8');
    return JSON.parse(content) as StoredRuntime;
  } catch (error) {
    return undefined;
  }
}

export function loadRuntimeSync(version?: string, options: RuntimeStoreOptions = {}) {
  if (!version) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(getRuntimeFile(version, options), 'utf8');
    return JSON.parse(content) as StoredRuntime;
  } catch (error) {
    return undefined;
  }
}

export async function listRuntimes(options: RuntimeStoreOptions = {}) {
  try {
    const entries = await fsp.readdir(getVersionsDir(options), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    return [];
  }
}

export async function deleteRuntime(version: string, options: RuntimeStoreOptions = {}) {
  await fsp.rm(getVersionDir(version, options), { recursive: true, force: true });
}

export function hasRuntimeSync(version?: string, options: RuntimeStoreOptions = {}) {
  return version ? fs.existsSync(getRuntimeFile(version, options)) : false;
}
