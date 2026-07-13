/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { constants } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

import { storagePathJoin } from '@nocobase/utils';

export const FILE_UPLOAD_STORAGE_ROOT = storagePathJoin('agent-gateway', 'file-uploads');

export class UnsafeFileUploadStoragePathError extends Error {
  constructor() {
    super('Unsafe Agent Gateway file upload storage locator');
    this.name = 'UnsafeFileUploadStoragePathError';
  }
}

function isContainedPath(rootPath: string, candidatePath: string) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath))
  );
}

async function getRealStorageRoot() {
  await fs.mkdir(FILE_UPLOAD_STORAGE_ROOT, { recursive: true });
  return await fs.realpath(FILE_UPLOAD_STORAGE_ROOT);
}

function getLexicallyContainedPath(storageLocator: string) {
  if (!storageLocator || !path.isAbsolute(storageLocator)) {
    throw new UnsafeFileUploadStoragePathError();
  }

  const resolvedRoot = path.resolve(FILE_UPLOAD_STORAGE_ROOT);
  const resolvedCandidate = path.resolve(storageLocator);
  if (!isContainedPath(resolvedRoot, resolvedCandidate) || resolvedCandidate === resolvedRoot) {
    throw new UnsafeFileUploadStoragePathError();
  }
  return resolvedCandidate;
}

export async function createFileUploadStorageFile(uploadId: string) {
  const storagePath = getLexicallyContainedPath(path.join(FILE_UPLOAD_STORAGE_ROOT, `${uploadId}.part`));
  const realRoot = await getRealStorageRoot();
  const realParent = await fs.realpath(path.dirname(storagePath));
  if (!isContainedPath(realRoot, realParent)) {
    throw new UnsafeFileUploadStoragePathError();
  }

  const handle = await fs.open(
    storagePath,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
    0o600,
  );
  await handle.close();
  return storagePath;
}

export async function resolveFileUploadStoragePath(storageLocator: string) {
  const storagePath = getLexicallyContainedPath(storageLocator);
  const realRoot = await getRealStorageRoot();
  const fileStats = await fs.lstat(storagePath);
  if (fileStats.isSymbolicLink() || !fileStats.isFile()) {
    throw new UnsafeFileUploadStoragePathError();
  }

  const realStoragePath = await fs.realpath(storagePath);
  if (!isContainedPath(realRoot, realStoragePath)) {
    throw new UnsafeFileUploadStoragePathError();
  }
  return realStoragePath;
}
