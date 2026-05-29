/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL } from '@nocobase/utils';
import fsSync from 'fs';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import type { Readable } from 'stream';
import urlJoin from 'url-join';
import { AttachmentModel, StorageType } from '.';
import { FILE_SIZE_LIMIT_DEFAULT, STORAGE_TYPE_LOCAL } from '../../constants';
import { diskFilenameGetter } from '../utils';

const DEFAULT_BASE_URL = '/storage/uploads';
const SAFE_LOCAL_STORAGE_ROOT = 'storage';
const LOCAL_STORAGE_ALLOWED_ROOTS = 'LOCAL_STORAGE_ALLOWED_ROOTS';

function createInvalidLocalStoragePathError(message: string) {
  const error = new Error(message);
  (error as NodeJS.ErrnoException).code = 'INVALID_LOCAL_STORAGE_PATH';
  return error;
}

function assertSafeChildPath(basePath: string, targetPath: string, message: string) {
  const relative = path.relative(basePath, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw createInvalidLocalStoragePathError(message);
  }
}

function resolveDocumentRoot(documentRoot: unknown) {
  if (typeof documentRoot !== 'string' || !documentRoot) {
    throw createInvalidLocalStoragePathError('Invalid local storage document root');
  }
  if (documentRoot.includes('\0')) {
    throw createInvalidLocalStoragePathError('Invalid local storage document root');
  }

  return path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot));
}

function getDefaultAllowedDocumentRoots() {
  const roots = [path.resolve(process.cwd(), SAFE_LOCAL_STORAGE_ROOT)];

  if (process.env.LOCAL_STORAGE_DEST) {
    roots.push(resolveDocumentRoot(process.env.LOCAL_STORAGE_DEST));
  }

  if (process.env[LOCAL_STORAGE_ALLOWED_ROOTS]) {
    for (const root of process.env[LOCAL_STORAGE_ALLOWED_ROOTS].split(',')) {
      const trimmed = root.trim();
      if (trimmed) {
        roots.push(resolveDocumentRoot(trimmed));
      }
    }
  }

  return roots;
}

export function validateLocalDocumentRoot(documentRoot: unknown, allowedRoots = getDefaultAllowedDocumentRoots()) {
  const resolvedDocumentRoot = resolveDocumentRoot(documentRoot);
  if (
    !allowedRoots.some((allowedRoot) => {
      try {
        assertSafeChildPath(allowedRoot, resolvedDocumentRoot, 'Invalid local storage document root');
        return true;
      } catch (error) {
        return false;
      }
    })
  ) {
    throw createInvalidLocalStoragePathError('Invalid local storage document root');
  }
  return resolvedDocumentRoot;
}

export function normalizeLocalStoragePath(storagePath?: unknown) {
  if (storagePath == null || storagePath === '') {
    return '';
  }
  if (typeof storagePath !== 'string') {
    throw createInvalidLocalStoragePathError('Invalid local storage path');
  }
  if (storagePath.includes('\0')) {
    throw createInvalidLocalStoragePathError('Invalid local storage path');
  }
  return storagePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function validateLocalStorageConfig(
  storage: Pick<StorageType['storage'], 'type' | 'options' | 'path'>,
  options: { validateDocumentRoot?: boolean } = {},
) {
  if (storage.type !== STORAGE_TYPE_LOCAL) {
    return;
  }
  const { documentRoot = process.env.LOCAL_STORAGE_DEST || path.join(process.cwd(), 'storage', 'uploads') } =
    storage.options || {};
  const resolvedDocumentRoot = options.validateDocumentRoot
    ? validateLocalDocumentRoot(documentRoot)
    : resolveDocumentRoot(documentRoot);
  resolveSafePath(resolvedDocumentRoot, normalizeLocalStoragePath(storage.path));
}

export function getDocumentRoot(storage): string {
  const { documentRoot = process.env.LOCAL_STORAGE_DEST || path.join(process.cwd(), 'storage', 'uploads') } =
    storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return resolveDocumentRoot(documentRoot);
}

export function resolveSafePath(documentRoot: string, filePath?: string, filename?: string) {
  const root = path.resolve(documentRoot);
  const target = path.resolve(root, filePath || '', filename || '');
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    const error = new Error('Access denied');
    (error as NodeJS.ErrnoException).code = 'PATH_TRAVERSAL';
    throw error;
  }
  return target;
}

export default class extends StorageType {
  static defaults() {
    return {
      title: 'Local storage',
      type: STORAGE_TYPE_LOCAL,
      name: `local`,
      baseUrl: DEFAULT_BASE_URL,
      options: {
        documentRoot: 'storage/uploads',
      },
      path: '',
      rules: {
        size: FILE_SIZE_LIMIT_DEFAULT,
      },
    };
  }

  make() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const destPath = resolveSafePath(getDocumentRoot(this.storage), normalizeLocalStoragePath(this.storage.path));
        const mkdirp = require('mkdirp');
        mkdirp(destPath, (err: Error | null) => cb(err, destPath));
      },
      filename: diskFilenameGetter(this.storage),
    });
  }
  async exists(record: AttachmentModel): Promise<boolean> {
    try {
      await fs.stat(resolveSafePath(getDocumentRoot(this.storage), record.path, record.filename));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async copy(source: AttachmentModel, target: AttachmentModel): Promise<void> {
    const documentRoot = getDocumentRoot(this.storage);
    const sourcePath = resolveSafePath(documentRoot, source.path, source.filename);
    const targetPath = resolveSafePath(documentRoot, target.path, target.filename);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const documentRoot = getDocumentRoot(this.storage);
    let count = 0;
    const undeleted = [];
    await records.reduce(
      (promise, record) =>
        promise.then(async () => {
          try {
            const filePath = resolveSafePath(documentRoot, record.path, record.filename);
            await fs.unlink(filePath);
            count += 1;
          } catch (ex) {
            if (ex.code === 'PATH_TRAVERSAL') {
              console.warn(`[file-manager] blocked path traversal delete: ${record.path || ''}/${record.filename}`);
              count += 1;
            } else if (ex.code === 'ENOENT') {
              console.warn(ex.message);
              count += 1;
            } else {
              console.error(ex);
              undeleted.push(record);
            }
          }
        }),
      Promise.resolve(),
    );

    return [count, undeleted];
  }
  async getFileURL(file: AttachmentModel, preview = false) {
    const url = await super.getFileURL(file, preview);
    if (isURL(url)) {
      return url;
    }
    return urlJoin(process.env.APP_PUBLIC_PATH, url);
  }

  async getFileStream(file: AttachmentModel): Promise<{ stream: Readable; contentType?: string }> {
    // compatible with windows path
    const filePath = resolveSafePath(getDocumentRoot(this.storage), file.path, file.filename);
    if (await fs.stat(filePath)) {
      return {
        stream: fsSync.createReadStream(filePath),
        contentType: file.mimetype,
      };
    }
    throw new Error(`File not found: ${filePath}`);
  }
}
