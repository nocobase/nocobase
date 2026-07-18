/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Database, type Model, UniqueConstraintError } from '@nocobase/database';
import type { AttachmentModel, PluginFileManagerServer, StorageModel } from '@nocobase/plugin-file-manager';
import { createHash } from 'crypto';
import { once } from 'events';
import fs from 'fs/promises';
import { lookup as lookupMimeType } from 'mime-types';
import os from 'os';
import path from 'path';
import type { Readable } from 'stream';

import { LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME } from '../../constants';

export { LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME };
export const LIGHT_EXTENSION_CLIENT_APP_STORAGE_BASE_URL = '/_internal/light-extension-client-app-assets';
export const LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT = 'storage/light-extension-client-app-assets';

export interface ClientAppStoredFile {
  id?: string | number;
  title: string;
  filename: string;
  extname?: string;
  size: number;
  mimetype?: string;
  path: string;
  url?: string;
  storageId: string | number;
  meta?: Record<string, unknown>;
}

export interface ClientAppAssetStorage {
  reserve(input: { assetSetId: string; relativePath: string; byteSize: number }): Promise<ClientAppStoredFile>;
  stage(input: {
    assetSetId: string;
    relativePath: string;
    filePath: string;
    reservedFile?: ClientAppStoredFile;
  }): Promise<ClientAppStoredFile>;
  open(file: ClientAppStoredFile): Promise<{ stream: Readable; contentType?: string }>;
  delete(files: readonly ClientAppStoredFile[]): Promise<void>;
}

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type FileManagerLike = Pick<
  PluginFileManagerServer,
  'getFileStream' | 'loadStorages' | 'storageTypes' | 'storagesCache' | 'uploadFile'
>;

const FILE_MANAGER_PLUGIN_ALIASES = ['@nocobase/plugin-file-manager', 'file-manager', 'plugin-file-manager'];

export class FileManagerClientAppStorage implements ClientAppAssetStorage {
  constructor(
    private readonly fileManager: FileManagerLike,
    private readonly storageName = LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME,
  ) {}

  async reserve(input: { assetSetId: string; relativePath: string; byteSize: number }): Promise<ClientAppStoredFile> {
    const expectedStorage = [...this.fileManager.storagesCache.values()].find(
      (storage) => storage.name === this.storageName,
    );
    if (!expectedStorage?.id) {
      throw new Error(`Client app storage "${this.storageName}" is unavailable`);
    }
    assertInternalStorageConfiguration(expectedStorage);
    const sourceExtension = path.posix.extname(input.relativePath);
    const physicalExtension = /^\.[A-Za-z0-9]{1,16}$/u.test(sourceExtension) ? sourceExtension.toLowerCase() : '.asset';
    const physicalFilename = `${createHash('sha256').update(input.relativePath).digest('hex')}${physicalExtension}`;
    const mimeType = lookupMimeType(input.relativePath);
    return {
      title: path.posix.basename(input.relativePath, sourceExtension),
      filename: physicalFilename,
      extname: physicalExtension,
      size: input.byteSize,
      ...(mimeType ? { mimetype: mimeType } : {}),
      path: input.assetSetId,
      storageId: expectedStorage.id,
    };
  }

  async stage(input: {
    assetSetId: string;
    relativePath: string;
    filePath: string;
    reservedFile?: ClientAppStoredFile;
  }): Promise<ClientAppStoredFile> {
    const stat = await fs.stat(input.filePath);
    const reservedFile =
      input.reservedFile ||
      (await this.reserve({ assetSetId: input.assetSetId, relativePath: input.relativePath, byteSize: stat.size }));
    const uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-client-app-object-'));
    let uploaded: unknown;
    try {
      const uploadPath = path.join(uploadRoot, reservedFile.filename);
      await fs.copyFile(input.filePath, uploadPath);
      uploaded = await this.fileManager.uploadFile({
        storageName: this.storageName,
        subPath: input.assetSetId,
        filePath: uploadPath,
      });
    } finally {
      await fs.rm(uploadRoot, { recursive: true, force: true }).catch(() => undefined);
    }
    let stored: ClientAppStoredFile;
    try {
      stored = toStoredFile(uploaded);
    } catch (error) {
      const cleanupRecord = toCleanupStoredFile(uploaded);
      if (cleanupRecord) {
        await this.delete([cleanupRecord]);
      }
      throw error;
    }
    if (String(stored.storageId) !== String(reservedFile.storageId)) {
      await this.delete([stored]);
      throw new Error(`Client app storage "${this.storageName}" was not used`);
    }
    if (stored.filename !== reservedFile.filename || stored.path !== reservedFile.path) {
      await this.delete([stored]);
      throw new Error(`Client app storage "${this.storageName}" changed the reserved physical object location`);
    }
    return {
      ...stored,
      title: reservedFile.title,
      ...(reservedFile.extname ? { extname: reservedFile.extname } : {}),
      ...(reservedFile.mimetype ? { mimetype: reservedFile.mimetype } : {}),
    };
  }

  async open(file: ClientAppStoredFile): Promise<{ stream: Readable; contentType?: string }> {
    const opened = await this.fileManager.getFileStream(file as AttachmentModel);
    if (isPendingFileStream(opened.stream)) {
      await once(opened.stream, 'open');
    }
    return opened;
  }

  async delete(files: readonly ClientAppStoredFile[]): Promise<void> {
    const grouped = new Map<string | number, ClientAppStoredFile[]>();
    for (const file of files) {
      const current = grouped.get(file.storageId) || [];
      current.push(file);
      grouped.set(file.storageId, current);
    }

    for (const [storageId, records] of grouped) {
      const storage =
        this.fileManager.storagesCache.get(storageId) ||
        [...this.fileManager.storagesCache.values()].find((candidate) => String(candidate.id) === String(storageId));
      if (!storage) {
        throw new Error(`Client app storage ${String(storageId)} is unavailable`);
      }
      const StorageType = this.fileManager.storageTypes.get(storage.type);
      if (!StorageType) {
        throw new Error(`Client app storage type "${storage.type}" is unavailable`);
      }
      const [deleted, undeleted] = await new StorageType(storage).delete(records as AttachmentModel[]);
      if (deleted !== records.length || undeleted.length) {
        throw new Error('Failed to delete one or more client app assets');
      }
    }
  }
}

export function findFileManagerPlugin(pm: PluginManagerLike | undefined): FileManagerLike | undefined {
  for (const alias of FILE_MANAGER_PLUGIN_ALIASES) {
    const plugin = pm?.get?.(alias);
    if (isFileManagerLike(plugin)) {
      return plugin;
    }
  }

  for (const plugin of pm?.getPlugins?.().values() || []) {
    if (isFileManagerLike(plugin)) {
      return plugin;
    }
  }
}

export async function ensureClientAppInternalStorage(
  db: Database,
  fileManager: FileManagerLike,
): Promise<StorageModel> {
  const repository = db.getRepository('storages');
  const values = getInternalStorageValues();
  let record = await repository.findOne({
    filter: { name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME },
  });
  if (!record) {
    try {
      record = await repository.create({ values });
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }
      record = await repository.findOne({ filter: { name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME } });
      if (!record) {
        throw error;
      }
    }
  } else {
    await record.update(values);
  }

  await fileManager.loadStorages();
  return modelToStorage(record);
}

function isFileManagerLike(value: unknown): value is FileManagerLike {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<FileManagerLike>;
  return (
    typeof candidate.uploadFile === 'function' &&
    typeof candidate.getFileStream === 'function' &&
    typeof candidate.loadStorages === 'function' &&
    candidate.storagesCache instanceof Map &&
    Boolean(candidate.storageTypes)
  );
}

function toStoredFile(value: unknown): ClientAppStoredFile {
  if (!value || typeof value !== 'object') {
    throw new Error('File Manager returned an invalid client app asset');
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.filename !== 'string' ||
    typeof record.path !== 'string' ||
    (typeof record.storageId !== 'string' && typeof record.storageId !== 'number') ||
    typeof record.size !== 'number'
  ) {
    throw new Error('File Manager returned incomplete client app asset metadata');
  }
  return {
    title:
      typeof record.title === 'string' ? record.title : path.basename(record.filename, path.extname(record.filename)),
    filename: record.filename,
    ...(typeof record.extname === 'string' ? { extname: record.extname } : {}),
    size: record.size,
    ...(typeof record.mimetype === 'string' ? { mimetype: record.mimetype } : {}),
    path: record.path,
    ...(typeof record.url === 'string' ? { url: record.url } : {}),
    storageId: record.storageId,
    ...(isRecord(record.meta) ? { meta: record.meta } : {}),
  };
}

function toCleanupStoredFile(value: unknown): ClientAppStoredFile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.filename !== 'string' ||
    typeof record.path !== 'string' ||
    (typeof record.storageId !== 'string' && typeof record.storageId !== 'number')
  ) {
    return null;
  }
  return {
    title: '',
    filename: record.filename,
    size: typeof record.size === 'number' ? record.size : 0,
    path: record.path,
    storageId: record.storageId,
  };
}

function modelToStorage(record: Model | StorageModel): StorageModel {
  const value = typeof (record as Model).toJSON === 'function' ? (record as Model).toJSON() : record;
  return value as StorageModel;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getInternalStorageValues() {
  return {
    title: 'Light extension client app internal storage',
    type: 'local',
    name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME,
    baseUrl: LIGHT_EXTENSION_CLIENT_APP_STORAGE_BASE_URL,
    options: {
      documentRoot: LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT,
    },
    path: '',
    renameMode: 'none',
    default: false,
    paranoid: false,
    rules: {
      size: 25 * 1024 * 1024,
    },
  };
}

function assertInternalStorageConfiguration(storage: StorageModel): void {
  const expected = getInternalStorageValues();
  if (
    storage.type !== expected.type ||
    storage.baseUrl !== expected.baseUrl ||
    (storage.path || '') !== expected.path ||
    storage.renameMode !== expected.renameMode ||
    storage.default === true ||
    storage.options?.documentRoot !== expected.options.documentRoot
  ) {
    throw new Error(`Client app storage "${storage.name}" is not configured as private internal storage`);
  }
}

function isPendingFileStream(stream: Readable): stream is Readable & { pending: true } {
  return 'pending' in stream && stream.pending === true;
}
