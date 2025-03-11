/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import multer from 'multer';
import path from 'path';
import { AttachmentModel, StorageType } from '.';
import { FILE_SIZE_LIMIT_DEFAULT, STORAGE_TYPE_LOCAL } from '../../constants';
import { getFilename } from '../utils';

function getDocumentRoot(storage): string {
  const { documentRoot = process.env.LOCAL_STORAGE_DEST || 'storage/uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot));
}

export default class extends StorageType {
  static defaults() {
    return {
      title: 'Local storage',
      type: STORAGE_TYPE_LOCAL,
      name: `local`,
      baseUrl: '/storage/uploads',
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
        mkdirp(destPath, (err: Error | null) => cb(err, destPath));
      },
      filename: getFilename,
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
            await fs.unlink(path.join(documentRoot, record.path, record.filename));
            count += 1;
          } catch (ex) {
            if (ex.code === 'ENOENT') {
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
  getFileURL(file: AttachmentModel) {
    return process.env.APP_PUBLIC_PATH ? `${process.env.APP_PUBLIC_PATH.replace(/\/$/g, '')}${file.url}` : file.url;
  }
}
