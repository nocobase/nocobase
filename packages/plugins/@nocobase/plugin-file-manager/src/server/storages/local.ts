/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL, resolveStorageRoot, storagePathJoin } from '@nocobase/utils';
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

export function getDocumentRoot(storage): string {
  const raw = storagePathJoin('uploads');

  if (path.isAbsolute(raw)) {
    return raw;
  }

  return path.resolve(process.cwd(), raw);
}

export function resolveSafePath(documentRoot: string, filePath?: string, filename?: string) {
  const root = storagePathJoin('uploads');
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
        const destPath = path.join(getDocumentRoot(this.storage), this.storage.path || '');
        const mkdirp = require('mkdirp');
        mkdirp(destPath, (err: Error | null) => cb(err, destPath));
      },
      filename: diskFilenameGetter(this.storage),
    });
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
