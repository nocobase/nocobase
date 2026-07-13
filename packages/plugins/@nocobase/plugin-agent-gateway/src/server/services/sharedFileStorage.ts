/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { Plugin } from '@nocobase/server';
import { storagePathJoin } from '@nocobase/utils';

interface FileManagerUploadResult {
  storageId: string | number;
  path: string;
  filename: string;
  size?: number;
  mimetype?: string;
}

interface FileManagerStorageModel {
  id?: string | number;
  default?: boolean;
  type: string;
  path?: string;
  options?: {
    documentRoot?: unknown;
  };
}

interface FileManagerStorageInstance {
  copy(source: SharedStorageObject, target: SharedStorageObject): Promise<void>;
  delete(records: SharedStorageObject[]): Promise<[number, SharedStorageObject[]]> | [number, SharedStorageObject[]];
}

interface FileManagerStorageClass {
  new (storage: FileManagerStorageModel): FileManagerStorageInstance;
}

interface FileManagerPluginLike {
  storagesCache: Map<string | number, FileManagerStorageModel>;
  storageTypes: {
    get(type: string): FileManagerStorageClass | undefined;
  };
  loadStorages(): Promise<void>;
  uploadFile(options: { filePath: string; subPath: string }): Promise<unknown>;
  getFileStream(file: SharedStorageObject): Promise<{ stream: Readable; contentType?: string }>;
}

export interface SharedStorageObject {
  storageId: string | number;
  path: string;
  filename: string;
  objectKey: string;
  sizeBytes: number;
  mimetype?: string;
  title: string;
}

export interface SharedStorageObjectScope {
  path: string;
  filename?: string;
}

export interface MaterializedStorageObjects {
  filePath: string;
  sha256: string;
  sizeBytes: number;
  cleanup(): Promise<void>;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getStorageId(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function normalizeSegments(value: string) {
  const segments = value
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.');
  if (!segments.length || segments.some((segment) => segment === '..' || segment.includes('\0'))) {
    throw new Error('Invalid Agent Gateway storage object key');
  }
  return segments;
}

function normalizeOwnedSubPath(value: string) {
  const segments = normalizeSegments(value);
  if (segments[0] !== 'agent-gateway') {
    throw new Error('Agent Gateway storage objects must use the agent-gateway prefix');
  }
  return segments.join('/');
}

function isPathInside(base: string, target: string) {
  const relative = path.relative(base, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function normalizeLocalDocumentRoot(value: unknown) {
  const documentRoot = typeof value === 'string' && value ? value : storagePathJoin('uploads');
  if (path.isAbsolute(documentRoot)) {
    return path.resolve(documentRoot);
  }
  const normalized = documentRoot.replace(/\\/g, '/');
  if (
    normalized === 'storage' ||
    normalized.startsWith('storage/') ||
    normalized === './storage' ||
    normalized.startsWith('./storage/')
  ) {
    const relativePath = normalized.replace(/^\.?\/?storage(?:\/|$)/, '').replace(/^[/\\]+/, '');
    return relativePath ? storagePathJoin(relativePath) : storagePathJoin();
  }
  return path.resolve(process.cwd(), documentRoot);
}

function getLocalStorageDocumentRoot(storage: FileManagerStorageModel) {
  return normalizeLocalDocumentRoot(
    storage.options?.documentRoot ?? process.env.LOCAL_STORAGE_DEST ?? storagePathJoin('uploads'),
  );
}

async function getLocalStorageRealRoot(storage: FileManagerStorageModel) {
  const documentRoot = getLocalStorageDocumentRoot(storage);
  await fs.mkdir(documentRoot, { recursive: true });
  return {
    documentRoot,
    realRoot: await fs.realpath(documentRoot),
  };
}

function assertLexicalLocalPath(documentRoot: string, targetPath: string) {
  if (!isPathInside(documentRoot, targetPath)) {
    throw new Error('Agent Gateway local storage path is outside the storage root');
  }
}

async function findExistingAncestor(targetPath: string) {
  let candidate = targetPath;
  while (path.dirname(candidate) !== candidate) {
    try {
      await fs.lstat(candidate);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      candidate = path.dirname(candidate);
    }
  }
  await fs.lstat(candidate);
  return candidate;
}

async function assertNoSymbolicLinkComponents(documentRoot: string, targetPath: string) {
  const relative = path.relative(documentRoot, targetPath);
  if (!relative) {
    return;
  }
  let currentPath = documentRoot;
  for (const segment of relative.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    try {
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink()) {
        throw new Error('Agent Gateway local storage path must not contain symbolic links');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}

async function assertLocalStorageDestination(storage: FileManagerStorageModel, objectPath: string, filename?: string) {
  if (storage.type !== 'local') {
    return;
  }
  const { documentRoot, realRoot } = await getLocalStorageRealRoot(storage);
  const targetPath = path.resolve(documentRoot, objectPath, filename || '');
  assertLexicalLocalPath(documentRoot, targetPath);
  await assertNoSymbolicLinkComponents(documentRoot, targetPath);
  const existingAncestor = await findExistingAncestor(targetPath);
  const realAncestor = await fs.realpath(existingAncestor);
  if (!isPathInside(realRoot, realAncestor)) {
    throw new Error('Agent Gateway local storage destination escapes through a symbolic link');
  }
}

async function assertLocalStorageObject(storage: FileManagerStorageModel, locator: SharedStorageObject) {
  if (storage.type !== 'local') {
    return;
  }
  const { documentRoot, realRoot } = await getLocalStorageRealRoot(storage);
  const targetPath = path.resolve(documentRoot, locator.path, locator.filename);
  assertLexicalLocalPath(documentRoot, targetPath);
  await assertNoSymbolicLinkComponents(documentRoot, targetPath);
  const realTarget = await fs.realpath(targetPath);
  if (!isPathInside(realRoot, realTarget)) {
    throw new Error('Agent Gateway local storage object escapes through a symbolic link');
  }
}

function buildObjectKey(objectPath: string, filename: string) {
  return [...normalizeSegments(objectPath), ...normalizeSegments(filename)].join('/');
}

function assertOwnedObject(locator: SharedStorageObject) {
  const objectKey = buildObjectKey(locator.path, locator.filename);
  const segments = normalizeSegments(objectKey);
  if (!segments.includes('agent-gateway') || objectKey !== locator.objectKey) {
    throw new Error('Invalid Agent Gateway storage object locator');
  }
  if (!getStorageId(locator.storageId) || !Number.isInteger(locator.sizeBytes) || locator.sizeBytes < 0) {
    throw new Error('Invalid Agent Gateway storage object locator');
  }
}

export function assertSharedStorageObjectScope(locator: SharedStorageObject, scope: SharedStorageObjectScope) {
  assertOwnedObject(locator);
  const objectPathSegments = normalizeSegments(locator.path);
  const expectedPathSegments = normalizeSegments(scope.path);
  const actualSuffix = objectPathSegments.slice(-expectedPathSegments.length);
  if (
    actualSuffix.length !== expectedPathSegments.length ||
    actualSuffix.some((segment, index) => segment !== expectedPathSegments[index]) ||
    (scope.filename !== undefined && locator.filename !== scope.filename)
  ) {
    throw new Error('Agent Gateway storage object does not belong to the expected record scope');
  }
  return locator;
}

function getFileManager(plugin: Pick<Plugin, 'app'>) {
  const fileManager = plugin.app.pm.get('file-manager') as unknown as FileManagerPluginLike | undefined;
  if (!fileManager) {
    throw new Error('Agent Gateway requires the file-manager plugin');
  }
  return fileManager;
}

async function ensureStoragesLoaded(fileManager: FileManagerPluginLike) {
  if (!fileManager.storagesCache.size) {
    await fileManager.loadStorages();
  }
}

function toStorageObject(value: unknown): SharedStorageObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('File manager returned an invalid storage object');
  }
  const record = value as Record<string, unknown>;
  const storageId = getStorageId(record.storageId);
  const objectPath = getString(record.path);
  const filename = getString(record.filename);
  const sizeBytes = Number(record.size);
  if (!storageId || !objectPath || !filename || !Number.isInteger(sizeBytes) || sizeBytes < 0) {
    throw new Error('File manager returned an invalid storage object');
  }
  const locator: SharedStorageObject = {
    storageId,
    path: objectPath,
    filename,
    objectKey: buildObjectKey(objectPath, filename),
    sizeBytes,
    mimetype: getString(record.mimetype) || undefined,
    title: getString(record.title) || path.parse(filename).name,
  };
  assertOwnedObject(locator);
  return locator;
}

function getStorageRuntime(fileManager: FileManagerPluginLike, storageId: string | number) {
  const storage =
    fileManager.storagesCache.get(storageId) ||
    Array.from(fileManager.storagesCache.entries()).find(([key]) => String(key) === String(storageId))?.[1];
  if (!storage) {
    throw new Error('Agent Gateway storage provider is unavailable');
  }
  const StorageType = fileManager.storageTypes.get(storage.type);
  if (!StorageType) {
    throw new Error('Agent Gateway storage provider type is unavailable');
  }
  return {
    storage,
    instance: new StorageType(storage),
  };
}

function getTargetObjectPath(storage: FileManagerStorageModel, subPath: string) {
  const ownedSubPath = normalizeOwnedSubPath(subPath);
  const basePath = getString(storage.path)
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  return basePath ? `${basePath}/${ownedSubPath}` : ownedSubPath;
}

function assertObjectOwnedByStorage(storage: FileManagerStorageModel, locator: SharedStorageObject) {
  assertOwnedObject(locator);
  const ownedRoot = getTargetObjectPath(storage, 'agent-gateway');
  if (locator.path !== ownedRoot && !locator.path.startsWith(`${ownedRoot}/`)) {
    throw new Error('Agent Gateway storage object is outside the owned prefix');
  }
}

export async function putSharedStorageBuffer(
  plugin: Pick<Plugin, 'app'>,
  options: { content: Buffer; filename: string; mimetype?: string; subPath: string },
) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-storage-put-'));
  const temporaryPath = path.join(temporaryDirectory, path.basename(options.filename));
  try {
    await fs.writeFile(temporaryPath, options.content, { mode: 0o600 });
    const locator = await putSharedStorageFile(plugin, {
      filePath: temporaryPath,
      subPath: options.subPath,
    });
    return {
      ...locator,
      mimetype: options.mimetype || locator.mimetype,
    };
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export async function putSharedStorageFile(
  plugin: Pick<Plugin, 'app'>,
  options: { filePath: string; subPath: string },
) {
  const fileManager = getFileManager(plugin);
  await ensureStoragesLoaded(fileManager);
  const sourceStat = await fs.lstat(options.filePath);
  if (sourceStat.isSymbolicLink()) {
    throw new Error('Agent Gateway storage upload source must not be a symbolic link');
  }
  const defaultStorage = Array.from(fileManager.storagesCache.values()).find((storage) => storage.default);
  if (!defaultStorage) {
    throw new Error('Agent Gateway storage provider is unavailable');
  }
  await assertLocalStorageDestination(defaultStorage, getTargetObjectPath(defaultStorage, options.subPath));
  const result = await fileManager.uploadFile({
    filePath: options.filePath,
    subPath: normalizeOwnedSubPath(options.subPath),
  });
  const locator = toStorageObject(result);
  const { storage } = getStorageRuntime(fileManager, locator.storageId);
  assertObjectOwnedByStorage(storage, locator);
  await assertLocalStorageObject(storage, locator);
  return locator;
}

export async function getSharedStorageStream(plugin: Pick<Plugin, 'app'>, locator: SharedStorageObject) {
  assertOwnedObject(locator);
  const fileManager = getFileManager(plugin);
  await ensureStoragesLoaded(fileManager);
  const { storage } = getStorageRuntime(fileManager, locator.storageId);
  assertObjectOwnedByStorage(storage, locator);
  await assertLocalStorageObject(storage, locator);
  return await fileManager.getFileStream(locator);
}

export async function readSharedStorageBuffer(
  plugin: Pick<Plugin, 'app'>,
  locator: SharedStorageObject,
  maxBytes: number,
) {
  const { stream } = await getSharedStorageStream(plugin, locator);
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > maxBytes) {
      stream.destroy();
      throw new Error('Agent Gateway storage object exceeds the read limit');
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, totalBytes);
}

export async function deleteSharedStorageObject(plugin: Pick<Plugin, 'app'>, locator: SharedStorageObject) {
  assertOwnedObject(locator);
  const fileManager = getFileManager(plugin);
  await ensureStoragesLoaded(fileManager);
  const { storage, instance } = getStorageRuntime(fileManager, locator.storageId);
  assertObjectOwnedByStorage(storage, locator);
  await assertLocalStorageObject(storage, locator);
  const [deletedCount, undeleted] = await instance.delete([locator]);
  if (deletedCount !== 1 || undeleted.length) {
    throw new Error('Agent Gateway storage object deletion failed');
  }
}

export async function copySharedStorageObject(
  plugin: Pick<Plugin, 'app'>,
  source: SharedStorageObject,
  options: { filename: string; subPath: string; mimetype?: string },
) {
  assertOwnedObject(source);
  const fileManager = getFileManager(plugin);
  await ensureStoragesLoaded(fileManager);
  const { storage, instance } = getStorageRuntime(fileManager, source.storageId);
  assertObjectOwnedByStorage(storage, source);
  await assertLocalStorageObject(storage, source);
  const targetPath = getTargetObjectPath(storage, options.subPath);
  const targetFilename = path.basename(options.filename);
  await assertLocalStorageDestination(storage, targetPath, targetFilename);
  const target: SharedStorageObject = {
    storageId: source.storageId,
    path: targetPath,
    filename: targetFilename,
    objectKey: buildObjectKey(targetPath, targetFilename),
    sizeBytes: source.sizeBytes,
    mimetype: options.mimetype || source.mimetype,
    title: path.parse(targetFilename).name,
  };
  assertObjectOwnedByStorage(storage, target);
  await instance.copy(source, target);
  await assertLocalStorageObject(storage, target);
  return target;
}

export async function materializeSharedStorageObjects(
  plugin: Pick<Plugin, 'app'>,
  locators: SharedStorageObject[],
  maxBytes: number,
): Promise<MaterializedStorageObjects> {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-storage-compose-'));
  const filePath = path.join(temporaryDirectory, 'composed.bin');
  const handle = await fs.open(filePath, 'wx', 0o600);
  const hash = createHash('sha256');
  let sizeBytes = 0;
  try {
    for (const locator of locators) {
      const { stream } = await getSharedStorageStream(plugin, locator);
      for await (const chunk of stream) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        sizeBytes += buffer.byteLength;
        if (sizeBytes > maxBytes) {
          stream.destroy();
          throw new Error('Agent Gateway composed storage object exceeds the size limit');
        }
        await handle.write(buffer);
        hash.update(buffer);
      }
    }
  } catch (error) {
    await handle.close();
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
  await handle.close();
  return {
    filePath,
    sha256: hash.digest('hex'),
    sizeBytes,
    cleanup: async () => {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    },
  };
}

export function serializeSharedStorageObject(locator: SharedStorageObject) {
  assertOwnedObject(locator);
  return {
    storageId: locator.storageId,
    objectPath: locator.path,
    objectFilename: locator.filename,
    objectKey: locator.objectKey,
    sizeBytes: locator.sizeBytes,
    mimetype: locator.mimetype || null,
  };
}

export function parseSharedStorageObject(value: unknown, scope?: SharedStorageObjectScope): SharedStorageObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Agent Gateway storage object metadata');
  }
  const record = value as Record<string, unknown>;
  const storageId = getStorageId(record.storageId);
  const objectPath = getString(record.objectPath || record.path);
  const filename = getString(record.objectFilename || record.filename);
  const objectKey = getString(record.objectKey);
  const sizeBytes = Number(record.sizeBytes);
  if (!storageId || !objectPath || !filename || !objectKey || !Number.isInteger(sizeBytes) || sizeBytes < 0) {
    throw new Error('Invalid Agent Gateway storage object metadata');
  }
  const locator: SharedStorageObject = {
    storageId,
    path: objectPath,
    filename,
    objectKey,
    sizeBytes,
    mimetype: getString(record.mimetype) || undefined,
    title: path.parse(filename).name,
  };
  assertOwnedObject(locator);
  return scope ? assertSharedStorageObjectScope(locator, scope) : locator;
}
