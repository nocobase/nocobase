/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL, storagePathJoin } from '@nocobase/utils';
import fsSync from 'fs';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import type { Readable } from 'stream';
import urlJoin from 'url-join';
import { AttachmentModel, StorageType } from '.';
import { FILE_SIZE_LIMIT_DEFAULT, STORAGE_TYPE_LOCAL } from '../../constants';
import { diskFilenameGetter, normalizeDocumentRoot } from '../utils';

const DEFAULT_BASE_URL = '/storage/uploads';

function pathError(message: string) {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = 'PATH_TRAVERSAL';
  return error;
}

function isInside(base: string, target: string) {
  const relative = path.relative(base, target);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function resolveDocumentRoot(documentRoot: unknown) {
  if (typeof documentRoot !== 'string' || !documentRoot || documentRoot.includes('\0')) {
    throw pathError('Invalid local storage document root');
  }
  return normalizeDocumentRoot(documentRoot);
}

// 受信任的允许根：<cwd>/storage 加上环境变量显式声明的目录
function allowedRoots() {
  const roots = [storagePathJoin()];
  const extra = [process.env.LOCAL_STORAGE_DEST, ...(process.env.LOCAL_STORAGE_ALLOWED_ROOTS?.split(',') ?? [])];
  for (const item of extra) {
    if (item?.trim()) {
      roots.push(resolveDocumentRoot(item.trim()));
    }
  }
  return roots;
}

export function normalizeLocalStoragePath(storagePath?: unknown) {
  if (storagePath == null || storagePath === '') {
    return '';
  }
  if (typeof storagePath !== 'string' || storagePath.includes('\0')) {
    throw pathError('Invalid local storage path');
  }
  return storagePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function getDocumentRoot(storage): string {
  const raw = storage?.options?.documentRoot ?? process.env.LOCAL_STORAGE_DEST ?? storagePathJoin('uploads');
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return resolveDocumentRoot(raw);
}

export function resolveSafePath(documentRoot: string, filePath?: string, filename?: string) {
  const root = resolveDocumentRoot(documentRoot);
  const target = path.resolve(root, filePath || '', filename || '');
  if (!isInside(root, target)) {
    throw pathError('Access denied');
  }
  return target;
}

export function validateLocalStorageConfig(
  storage: Pick<StorageType['storage'], 'type' | 'options' | 'path'>,
  { validateDocumentRoot = false } = {},
) {
  if (storage.type !== STORAGE_TYPE_LOCAL) {
    return;
  }
  const root = getDocumentRoot(storage);
  // 仅对用户提交的 documentRoot 走白名单校验；env/已存值视为可信
  if (validateDocumentRoot && !allowedRoots().some((allowed) => isInside(allowed, root))) {
    throw pathError('Invalid local storage document root');
  }
  resolveSafePath(root, normalizeLocalStoragePath(storage.path));
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
