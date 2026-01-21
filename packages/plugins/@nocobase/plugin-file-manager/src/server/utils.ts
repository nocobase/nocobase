/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import crypto from 'crypto';
import path from 'path';
import urlJoin from 'url-join';

function normalizeOriginalname(file) {
  const originalname = file?.originalname;
  if (!originalname) {
    return '';
  }
  if (Buffer.isBuffer(originalname)) {
    return originalname.toString('utf8');
  }
  const decoded = Buffer.from(originalname, 'binary').toString('utf8');
  if (decoded.includes('\uFFFD')) {
    return originalname;
  }
  return decoded;
}

export function getFilename(req, file, cb) {
  const originalname = normalizeOriginalname(file);
  // Filename in Windows cannot contain the following characters: < > ? * | : " \ /
  const baseName = path.basename(originalname.replace(/[<>?*|:"\\/]/g, '-'), path.extname(originalname));
  cb(null, `${baseName}-${uid(6)}${path.extname(originalname)}`);
}

function getOriginalFilename(file) {
  const originalname = normalizeOriginalname(file);
  const extname = path.extname(originalname);
  const baseName = path.basename(originalname.replace(/[<>?*|:"\\/]/g, '-'), extname);
  return `${baseName}${extname}`;
}

export const cloudFilenameGetter = (storage) => (req, file, cb) => {
  const renameMode = storage.renameMode;
  if (renameMode === 'random') {
    crypto.randomBytes(16, function (err, raw) {
      if (err) {
        return cb(err);
      }
      const filename = `${raw.toString('hex')}${path.extname(normalizeOriginalname(file))}`;
      cb(null, `${storage.path ? `${storage.path.replace(/\/+$/, '')}/` : ''}${filename}`);
    });
    return;
  }
  if (renameMode === 'none') {
    const filename = getOriginalFilename(file);
    cb(null, `${storage.path ? `${storage.path.replace(/\/+$/, '')}/` : ''}${filename}`);
    return;
  }
  getFilename(req, file, (err, filename) => {
    if (err) {
      return cb(err);
    }
    cb(null, `${storage.path ? `${storage.path.replace(/\/+$/, '')}/` : ''}${filename}`);
  });
};

export const diskFilenameGetter = (storage) => (req, file, cb) => {
  const renameMode = storage.renameMode;
  if (renameMode === 'random') {
    crypto.randomBytes(16, function (err, raw) {
      if (err) {
        return cb(err);
      }
      const filename = `${raw.toString('hex')}${path.extname(normalizeOriginalname(file))}`;
      cb(null, filename);
    });
    return;
  }
  if (renameMode === 'none') {
    cb(null, getOriginalFilename(file));
    return;
  }
  getFilename(req, file, cb);
};

export function getFileKey(record) {
  return urlJoin(record.path || '', record.filename).replace(/^\//, '');
}

export function ensureUrlEncoded(value) {
  try {
    // 如果解码后与原字符串不同，说明已经被转义过
    if (decodeURIComponent(value) !== value) {
      return value; // 已经是转义的，直接返回
    }
  } catch (e) {
    // 如果解码出错，说明是非法的编码，直接转义
    return encodeURIComponent(value);
  }

  // 如果没问题但字符串未转义过，则进行转义
  return encodeURIComponent(value);
}

function encodePathKeepSlash(path) {
  return path
    .split('/')
    .map((segment) => ensureUrlEncoded(segment))
    .join('/');
}

export function encodeURL(url) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.pathname = encodePathKeepSlash(parsedUrl.pathname);
    return parsedUrl.toString();
  } catch (error) {
    return url;
  }
}
