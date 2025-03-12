/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { uid } from '@nocobase/utils';

export function getFilename(req, file, cb) {
  const originalname = Buffer.from(file.originalname, 'binary').toString('utf8');
  const baseName = path.basename(originalname, path.extname(originalname));
  cb(null, `${baseName}-${uid(6)}${path.extname(originalname)}`);
}

export const cloudFilenameGetter = (storage) => (req, file, cb) => {
  getFilename(req, file, (err, filename) => {
    if (err) {
      return cb(err);
    }
    cb(null, `${storage.path ? `${storage.path.replace(/\/+$/, '')}/` : ''}${filename}`);
  });
};

export function getFileKey(record) {
  return [record.path.replace(/^\/|\/$/g, ''), record.filename].filter(Boolean).join('/');
}
