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

export type PublishType = 'backup' | 'migration' | 'database';
export type PublishAction = 'generate' | 'upload' | 'execute';

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

export function publishRootDir(cwd = process.cwd()) {
  return path.resolve(cwd, '.nocobase', 'publish');
}

export function defaultPublishDir(type: PublishType, env: string, cwd = process.cwd()) {
  return path.join(publishRootDir(cwd), type, env);
}

export function manifestPath(cwd = process.cwd()) {
  return path.join(publishRootDir(cwd), 'manifest.json');
}

export async function readManifest(cwd = process.cwd()): Promise<PublishManifest> {
  try {
    const content = await fsp.readFile(manifestPath(cwd), 'utf8');
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

export async function writeManifest(manifest: PublishManifest, cwd = process.cwd()) {
  const filePath = manifestPath(cwd);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(manifest, null, 2));
}

export async function upsertManifestEntry(entry: PublishManifestEntry, cwd = process.cwd()) {
  const manifest = await readManifest(cwd);
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
  await writeManifest(manifest, cwd);
  return entry;
}

export async function findManifestEntry(options: {
  type: PublishType;
  fileName: string;
  targetEnv?: string;
  sourceEnv?: string;
  cwd?: string;
}) {
  const manifest = await readManifest(options.cwd);
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
}) {
  if (path.isAbsolute(options.file) || options.file.includes('/') || options.file.includes('\\')) {
    return path.resolve(options.cwd || process.cwd(), options.file);
  }
  if (!options.sourceEnv) {
    throw new Error('Missing --from when --file is a file name. Use a path or provide --from.');
  }
  return path.join(defaultPublishDir(options.type, options.sourceEnv, options.cwd), options.file);
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
