/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  executeDownloadApiRequest,
  executeMultipartApiRequest,
  executeRawApiRequest,
} from './api-client.js';
import { resolveCliHomeDir } from './cli-home.js';

export type PublishType = 'backup' | 'migration' | 'database';
export type PublishAction = 'generate' | 'upload' | 'execute';
export type PublishFileScope = 'local' | 'remote';
export type PublishRemoteFileSource = 'backup' | 'migration' | 'artifact';
export type UserDefinedMigrationRule = 'schema-only' | 'overwrite';
export type SystemDefinedMigrationRule = 'overwrite-first' | 'schema-only';

export const userDefinedMigrationRuleOptions = ['schema-only', 'overwrite'] as const;
export const systemDefinedMigrationRuleOptions = ['overwrite-first', 'schema-only'] as const;

export interface PublishApiResponse {
  ok: boolean;
  status: number;
  data: any;
}

export interface PublishManifestEntry {
  type: PublishType;
  sourceEnv?: string;
  targetEnv?: string;
  fileName: string;
  localPath: string;
  checksum?: string;
  uploadedArtifactId?: string;
  uploadedAt?: string;
}

export interface PublishManifest {
  version: 1;
  artifacts: PublishManifestEntry[];
}

export interface PublishLocalFileEntry {
  scope: 'local';
  type: PublishType;
  env?: string;
  fileName: string;
  localPath: string;
  exists: boolean;
  size?: number;
  modifiedAt?: string;
  checksum?: string;
  sourceEnv?: string;
  targetEnv?: string;
  uploadedArtifactId?: string;
  uploadedAt?: string;
}

export interface PublishRemoteFileEntry {
  scope: 'remote';
  source: PublishRemoteFileSource;
  type: PublishType;
  env?: string;
  fileName?: string;
  artifactId?: string;
  state?: string;
  status?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  checksum?: string;
  inProgress?: boolean;
  metadata?: Record<string, any>;
  raw: any;
}

export interface MigrationRuleValues {
  name: string;
  description?: string;
  rules: {
    userDefined: {
      globalRule: UserDefinedMigrationRule;
    };
    systemDefined: {
      globalRule: SystemDefinedMigrationRule;
    };
  };
}

export function assertPublishType(type: string): PublishType {
  if (type === 'backup' || type === 'migration' || type === 'database') {
    return type;
  }
  throw new Error(`Unsupported publish type: ${type}`);
}

export function assertPublishCapability(capabilities: any, type: PublishType, action: PublishAction) {
  const typeCapabilities = capabilities?.types?.[type];
  if (!typeCapabilities?.[action]) {
    throw new Error(`Publish ${action} is not supported for type "${type}" on this environment.`);
  }
}

export function assertPublishFileScope(scope: string): PublishFileScope {
  if (scope === 'local' || scope === 'remote') {
    return scope;
  }
  throw new Error(`Unsupported publish file scope: ${scope}`);
}

export function assertPublishRemoteFileSource(source: string): PublishRemoteFileSource {
  if (source === 'backup' || source === 'migration' || source === 'artifact') {
    return source;
  }
  throw new Error(`Unsupported publish file source: ${source}`);
}

export function assertUserDefinedMigrationRule(rule: string): UserDefinedMigrationRule {
  if ((userDefinedMigrationRuleOptions as readonly string[]).includes(rule)) {
    return rule as UserDefinedMigrationRule;
  }
  throw new Error(`Unsupported user-defined migration rule: ${rule}`);
}

export function assertSystemDefinedMigrationRule(rule: string): SystemDefinedMigrationRule {
  if ((systemDefinedMigrationRuleOptions as readonly string[]).includes(rule)) {
    return rule as SystemDefinedMigrationRule;
  }
  throw new Error(`Unsupported system-defined migration rule: ${rule}`);
}

export function defaultRemoteFileSource(type: PublishType): PublishRemoteFileSource {
  if (type === 'backup') {
    return 'backup';
  }
  if (type === 'migration') {
    return 'migration';
  }
  return 'artifact';
}

export function getPublishResponseData(response: PublishApiResponse) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
  }

  let data = response.data;
  if (data && typeof data === 'object' && 'data' in data) {
    data = data.data;
  }
  if (data && typeof data === 'object' && data.status === 'ok' && 'data' in data) {
    data = data.data;
  }
  return data;
}

export function publishRootDir(cliHomeDir = resolveCliHomeDir('global')) {
  return path.join(cliHomeDir, 'publish');
}

export function defaultPublishDir(type: PublishType, env: string, cliHomeDir = resolveCliHomeDir('global')) {
  return path.join(publishRootDir(cliHomeDir), type, env);
}

export function manifestPath(cliHomeDir = resolveCliHomeDir('global')) {
  return path.join(publishRootDir(cliHomeDir), 'manifest.json');
}

export async function readManifest(cliHomeDir = resolveCliHomeDir('global')): Promise<PublishManifest> {
  try {
    const content = await fsp.readFile(manifestPath(cliHomeDir), 'utf8');
    const manifest = JSON.parse(content) as PublishManifest;
    return {
      version: 1,
      artifacts: Array.isArray(manifest.artifacts) ? manifest.artifacts : [],
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { version: 1, artifacts: [] };
    }
    throw error;
  }
}

export async function writeManifest(manifest: PublishManifest, cliHomeDir = resolveCliHomeDir('global')) {
  const filePath = manifestPath(cliHomeDir);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(manifest, null, 2));
}

async function statLocalPublishFile(filePath: string) {
  try {
    const stat = await fsp.stat(filePath);
    return {
      exists: true,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
      };
    }
    throw error;
  }
}

async function safeReadDir(dir: string, options?: any) {
  try {
    return await fsp.readdir(dir, options as any);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function localFileKey(entry: Pick<PublishLocalFileEntry, 'type' | 'env' | 'fileName' | 'localPath'>) {
  return [entry.type, entry.env || '', entry.fileName, path.resolve(entry.localPath)].join('\0');
}

function getManifestEntryEnv(entry: PublishManifestEntry) {
  return entry.sourceEnv || entry.targetEnv;
}

export async function listLocalPublishFiles(options: {
  type: PublishType;
  env?: string;
  cliHomeDir?: string;
}): Promise<PublishLocalFileEntry[]> {
  const cliHomeDir = options.cliHomeDir || resolveCliHomeDir('global');
  const manifest = await readManifest(cliHomeDir);
  const entries = new Map<string, PublishLocalFileEntry>();

  for (const manifestEntry of manifest.artifacts) {
    if (manifestEntry.type !== options.type) {
      continue;
    }

    const env = getManifestEntryEnv(manifestEntry);
    if (options.env && env !== options.env) {
      continue;
    }

    const stat = await statLocalPublishFile(manifestEntry.localPath);
    const entry: PublishLocalFileEntry = {
      scope: 'local',
      type: manifestEntry.type,
      env,
      fileName: manifestEntry.fileName,
      localPath: manifestEntry.localPath,
      sourceEnv: manifestEntry.sourceEnv,
      targetEnv: manifestEntry.targetEnv,
      checksum: manifestEntry.checksum,
      uploadedArtifactId: manifestEntry.uploadedArtifactId,
      uploadedAt: manifestEntry.uploadedAt,
      ...stat,
    };
    entries.set(localFileKey(entry), entry);
  }

  const typeDir = path.join(publishRootDir(cliHomeDir), options.type);
  const envNames = options.env
    ? [options.env]
    : (await safeReadDir(typeDir, { withFileTypes: true }))
      .filter((entry: any) => entry.isDirectory())
      .map((entry: any) => entry.name);

  for (const env of envNames) {
    const envDir = defaultPublishDir(options.type, env, cliHomeDir);
    const files = (await safeReadDir(envDir, { withFileTypes: true }))
      .filter((entry: any) => entry.isFile() && entry.name.endsWith('.nbdata'))
      .map((entry: any) => entry.name);

    for (const fileName of files) {
      const localPath = path.join(envDir, fileName);
      const stat = await statLocalPublishFile(localPath);
      const entry: PublishLocalFileEntry = {
        scope: 'local',
        type: options.type,
        env,
        sourceEnv: env,
        fileName,
        localPath,
        ...stat,
      };
      const key = localFileKey(entry);
      entries.set(key, {
        ...entry,
        ...entries.get(key),
        exists: stat.exists,
        size: stat.size,
        modifiedAt: stat.modifiedAt,
      });
    }
  }

  return [...entries.values()].sort((left, right) => {
    const rightTime = right.modifiedAt || right.uploadedAt || '';
    const leftTime = left.modifiedAt || left.uploadedAt || '';
    return rightTime.localeCompare(leftTime) || right.fileName.localeCompare(left.fileName);
  });
}

export async function upsertManifestEntry(entry: PublishManifestEntry, cliHomeDir = resolveCliHomeDir('global')) {
  const manifest = await readManifest(cliHomeDir);
  const index = manifest.artifacts.findIndex((item) => {
    return item.type === entry.type
      && item.fileName === entry.fileName
      && item.sourceEnv === entry.sourceEnv
      && item.targetEnv === entry.targetEnv;
  });
  if (index >= 0) {
    manifest.artifacts[index] = { ...manifest.artifacts[index], ...entry };
  } else {
    manifest.artifacts.push(entry);
  }
  await writeManifest(manifest, cliHomeDir);
  return entry;
}

export async function findManifestEntry(options: {
  type: PublishType;
  fileName: string;
  targetEnv?: string;
  sourceEnv?: string;
  cliHomeDir?: string;
}) {
  const manifest = await readManifest(options.cliHomeDir);
  return manifest.artifacts.find((entry) => {
    if (entry.type !== options.type || entry.fileName !== options.fileName) {
      return false;
    }
    if (options.targetEnv && entry.targetEnv !== options.targetEnv) {
      return false;
    }
    if (options.sourceEnv && entry.sourceEnv !== options.sourceEnv) {
      return false;
    }
    return true;
  });
}

export function resolveLocalPublishFile(options: {
  type: PublishType;
  file: string;
  sourceEnv?: string;
  cwd?: string;
  cliHomeDir?: string;
}) {
  if (path.isAbsolute(options.file) || options.file.includes('/') || options.file.includes('\\')) {
    return path.resolve(options.cwd || process.cwd(), options.file);
  }
  if (!options.sourceEnv) {
    throw new Error('Missing --from when --file is a file name. Use a path or provide --from.');
  }
  return path.join(defaultPublishDir(options.type, options.sourceEnv, options.cliHomeDir), options.file);
}

export async function checksumFile(filePath: string) {
  const hash = crypto.createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return `sha256:${hash.digest('hex')}`;
}

export async function publishCapabilities(options: {
  env?: string;
}) {
  return executeRawApiRequest({
    envName: options.env,
    method: 'get',
    path: '/publishCommands:capabilities',
  });
}

export async function publishGenerate(options: {
  env?: string;
  type: PublishType;
  ruleId?: string;
  title?: string;
}) {
  return executeRawApiRequest({
    envName: options.env,
    method: 'post',
    path: '/publishCommands:generate',
    body: {
      type: options.type,
      options: {
        ruleId: options.ruleId,
        title: options.title,
        sourceEnv: options.env,
      },
    },
  });
}

export async function publishDownload(options: {
  env?: string;
  type: PublishType;
  artifactId: string;
  outputPath: string;
}) {
  return executeDownloadApiRequest({
    envName: options.env,
    method: 'get',
    path: '/publishCommands:download',
    query: {
      type: options.type,
      artifactId: options.artifactId,
    },
    outputPath: options.outputPath,
  });
}

function normalizeListRows(data: any) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.rows)) {
    return data.rows;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.data?.rows)) {
    return data.data.rows;
  }
  return [];
}

function normalizeRemoteFileName(source: PublishRemoteFileSource, item: any) {
  if (source === 'artifact') {
    return item.fileName;
  }
  return item.name || item.fileName || item.filename;
}

function normalizeRemoteCreatedAt(item: any) {
  return item.createdAt || item.created_at || item.created || item.date;
}

function normalizeRemoteSize(item: any) {
  return item.size ?? item.fileSize ?? item.file_size;
}

function summarizeRawRemoteFile(source: PublishRemoteFileSource, item: any) {
  const summary: Record<string, any> = {};
  for (const key of [
    'name',
    'fileName',
    'fileSize',
    'size',
    'createdAt',
    'updatedAt',
    'status',
    'state',
    'inProgress',
    'artifactId',
    'checksum',
  ]) {
    if (item[key] !== undefined) {
      summary[key] = item[key];
    }
  }

  if (source === 'migration' && item.migrationRules) {
    summary.migrationRule = {
      id: item.migrationRules.id,
      name: item.migrationRules.name,
    };
  }

  return summary;
}

function applyClientPagination<T>(items: T[], page?: number, pageSize?: number) {
  if (!pageSize || pageSize <= 0) {
    return items;
  }
  const currentPage = page && page > 0 ? page : 1;
  return items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
}

export async function listRemotePublishFiles(options: {
  env?: string;
  type: PublishType;
  source?: PublishRemoteFileSource;
  page?: number;
  pageSize?: number;
}) {
  const source = options.source || defaultRemoteFileSource(options.type);
  let response: PublishApiResponse;

  if (source === 'backup') {
    if (options.type !== 'backup') {
      throw new Error('--source backup can only be used with --type backup');
    }
    response = await executeRawApiRequest({
      envName: options.env,
      method: 'post',
      path: '/backups:list',
    });
  } else if (source === 'migration') {
    if (options.type !== 'migration') {
      throw new Error('--source migration can only be used with --type migration');
    }
    response = await executeRawApiRequest({
      envName: options.env,
      method: 'post',
      path: '/migrationFiles:list',
      query: {
        page: options.page,
        pageSize: options.pageSize,
      },
    });
  } else {
    response = await executeRawApiRequest({
      envName: options.env,
      method: 'post',
      path: '/publishCommands:list',
      query: {
        type: options.type,
      },
    });
  }

  const data = getPublishResponseData(response);
  const rows = normalizeListRows(data)
    .filter((item: any) => source !== 'artifact' || item.type === options.type)
    .map((item: any): PublishRemoteFileEntry => ({
      scope: 'remote',
      source,
      type: options.type,
      env: options.env,
      fileName: normalizeRemoteFileName(source, item),
      artifactId: item.artifactId,
      state: item.state,
      status: item.status,
      size: normalizeRemoteSize(item),
      createdAt: normalizeRemoteCreatedAt(item),
      updatedAt: item.updatedAt,
      checksum: item.checksum,
      inProgress: item.inProgress,
      metadata: item.metadata,
      raw: summarizeRawRemoteFile(source, item),
    }));
  return source === 'migration' ? rows : applyClientPagination(rows, options.page, options.pageSize);
}

export async function downloadRemotePublishFile(options: {
  env?: string;
  type: PublishType;
  source?: PublishRemoteFileSource;
  fileName?: string;
  artifactId?: string;
  outputPath?: string;
  cliHomeDir?: string;
}) {
  const source = options.source || defaultRemoteFileSource(options.type);
  const fileName = options.fileName || options.artifactId;
  if (!fileName) {
    throw new Error(source === 'artifact' ? 'Missing --artifact or --file' : 'Missing --file');
  }

  const outputFileName = options.fileName || `${options.artifactId}.nbdata`;
  const outputPath = options.outputPath
    ? path.resolve(process.cwd(), options.outputPath)
    : path.join(defaultPublishDir(options.type, options.env || 'default', options.cliHomeDir), outputFileName);

  let response: PublishApiResponse;
  if (source === 'backup') {
    if (options.type !== 'backup') {
      throw new Error('--source backup can only be used with --type backup');
    }
    response = await executeDownloadApiRequest({
      envName: options.env,
      method: 'get',
      path: '/backups:download',
      query: {
        filterByTk: options.fileName,
      },
      outputPath,
    });
  } else if (source === 'migration') {
    if (options.type !== 'migration') {
      throw new Error('--source migration can only be used with --type migration');
    }
    response = await executeDownloadApiRequest({
      envName: options.env,
      method: 'get',
      path: '/migrationFiles:download',
      query: {
        filterByTk: options.fileName,
      },
      outputPath,
    });
  } else {
    if (!options.artifactId && options.fileName) {
      const artifacts = await listRemotePublishFiles({
        env: options.env,
        type: options.type,
        source: 'artifact',
      });
      const artifact = artifacts.find((item) => item.fileName === options.fileName);
      if (!artifact?.artifactId) {
        throw new Error(`No publish artifact found for file ${options.fileName}`);
      }
      options.artifactId = artifact.artifactId;
    }
    response = await publishDownload({
      env: options.env,
      type: options.type,
      artifactId: options.artifactId!,
      outputPath,
    });
  }

  const downloaded = getPublishResponseData(response);
  const checksum = downloaded.checksum || (await checksumFile(outputPath));
  await upsertManifestEntry({
    type: options.type,
    sourceEnv: options.env,
    fileName: path.basename(outputPath),
    localPath: outputPath,
    checksum,
  }, options.cliHomeDir);

  return {
    ...downloaded,
    type: options.type,
    source,
    sourceEnv: options.env,
    fileName: path.basename(outputPath),
    localPath: outputPath,
    checksum,
  };
}

export function buildMigrationRuleValues(options: {
  name: string;
  description?: string;
  userRule: UserDefinedMigrationRule;
  systemRule: SystemDefinedMigrationRule;
}): MigrationRuleValues {
  return {
    name: options.name,
    description: options.description,
    rules: {
      userDefined: {
        globalRule: options.userRule,
      },
      systemDefined: {
        globalRule: options.systemRule,
      },
    },
  };
}

export async function listMigrationRules(options: {
  env?: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await executeRawApiRequest({
    envName: options.env,
    method: 'post',
    path: '/migrationRules:list',
    query: {
      sort: ['-createdAt'],
      page: options.page,
      pageSize: options.pageSize,
    },
  });

  return normalizeListRows(getPublishResponseData(response));
}

export async function getMigrationRule(options: {
  env?: string;
  id: string;
}) {
  return getPublishResponseData(await executeRawApiRequest({
    envName: options.env,
    method: 'post',
    path: '/migrationRules:get',
    query: {
      filterByTk: options.id,
    },
  }));
}

export async function createMigrationRule(options: {
  env?: string;
  values: MigrationRuleValues;
}) {
  return getPublishResponseData(await executeRawApiRequest({
    envName: options.env,
    method: 'post',
    path: '/migrationRules:create',
    body: options.values,
  }));
}

export async function publishUpload(options: {
  env?: string;
  type: PublishType;
  sourceEnv?: string;
  filePath: string;
  fileName?: string;
  checksum?: string;
}) {
  return executeMultipartApiRequest({
    envName: options.env,
    method: 'post',
    path: '/publishCommands:upload',
    filePath: options.filePath,
    fileName: options.fileName,
    fields: {
      type: options.type,
      sourceEnv: options.sourceEnv,
      checksum: options.checksum,
    },
  });
}

export async function publishExecute(options: {
  env?: string;
  type: PublishType;
  artifactId: string;
  skipBackup?: boolean;
  backupBeforeExecute?: boolean;
  skipRevertOnError?: boolean;
  envTexts?: Array<{ text: string; secret: boolean }>;
}) {
  return executeRawApiRequest({
    envName: options.env,
    method: 'post',
    path: '/publishCommands:execute',
    body: {
      type: options.type,
      artifactId: options.artifactId,
      options: {
        skipBackup: options.skipBackup,
        backupBeforeExecute: options.backupBeforeExecute,
        skipRevertOnError: options.skipRevertOnError,
        envTexts: options.envTexts,
      },
    },
  });
}
