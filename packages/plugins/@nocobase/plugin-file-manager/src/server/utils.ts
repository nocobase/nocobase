/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import path from 'path';

export function getFilename(req, file, cb) {
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  cb(null, `${baseName}-${uid(6)}${path.extname(file.originalname)}`);
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
