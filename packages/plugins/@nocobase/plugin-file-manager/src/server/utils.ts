/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, Model } from '@nocobase/database';
import { storagePathJoin, uid } from '@nocobase/utils';
import crypto from 'crypto';
import path from 'path';
import urlJoin from 'url-join';
import type { AttachmentModel } from './storages';

const INVALID_FILENAME_CHARS = new Set(['<', '>', '?', '*', '|', ':', '"', '\\', '/']);

function sanitizeFilename(value: string) {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 || INVALID_FILENAME_CHARS.has(char) ? '-' : char;
    })
    .join('');
}

function normalizeOriginalname(file) {
  const originalname: string | Buffer | undefined = file?.originalname;
  if (!originalname) {
    return '';
  }
  if (Buffer.isBuffer(originalname)) {
    return originalname.toString('utf8');
  }
  if (Array.from(originalname).some((char: string) => char.charCodeAt(0) > 0xff)) {
    return originalname;
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
  const baseName = path.basename(sanitizeFilename(originalname), path.extname(originalname));
  cb(null, `${baseName}-${uid(6)}${path.extname(originalname)}`);
}

function getOriginalFilename(file) {
  const originalname = normalizeOriginalname(file);
  const extname = path.extname(originalname);
  const baseName = path.basename(sanitizeFilename(originalname), extname);
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

export function trimPublicPath(path?: string) {
  const normalized = path?.replace(/\/+$/g, '') || '';
  return normalized === '/' ? '' : normalized;
}

export function getFilePublicBasePath() {
  return trimPublicPath(process.env.APP_PUBLIC_PATH);
}

export function normalizeFileAccessExtname(value: unknown) {
  if (
    typeof value !== 'string' ||
    value.length < 2 ||
    !value.startsWith('.') ||
    value.slice(1).includes('.') ||
    value.includes('/') ||
    value.includes('\\')
  ) {
    return '';
  }
  return value;
}

export function getFileAccessPathSegment(id: string | number, extname: unknown) {
  return `${encodeURIComponent(String(id))}${encodeURIComponent(normalizeFileAccessExtname(extname))}`;
}

export function hasStandardFileId(collection: Collection) {
  return Boolean(
    collection.getField?.('id') ||
      collection.model?.primaryKeyAttribute === 'id' ||
      collection.model?.rawAttributes?.id ||
      collection.model?.getAttributes?.().id,
  );
}

export function getRecordCollectionName(file: AttachmentModel) {
  const modelName = (file as unknown as Model)?.constructor?.name;
  return modelName && modelName !== 'Object' ? modelName : 'attachments';
}

export function getFilePlainObject(file: AttachmentModel) {
  if (typeof (file as unknown as Model)?.get === 'function') {
    return { ...((file as unknown as Model).get() as AttachmentModel) };
  }
  return { ...file };
}

export function getFileRecordValue(file: unknown, key: string) {
  if (!file || typeof file !== 'object') {
    return undefined;
  }
  const model = file as Model;
  if (typeof model.get === 'function') {
    return model.get(key);
  }
  return (file as Record<string, unknown>)[key];
}

export function isPermanentFileAccessURL(value: unknown, file: AttachmentModel, appName: string) {
  if (typeof value !== 'string' || !file.id) {
    return false;
  }
  try {
    const url = new URL(value, 'http://localhost');
    const segments = url.pathname.split('/').filter(Boolean);
    const filesIndex = segments.indexOf('files');
    const filePathSegments = segments.length - filesIndex;
    if (filesIndex === -1 || filePathSegments !== 5) {
      return false;
    }
    const fileIdSegment = decodeURIComponent(segments[filesIndex + 4]);
    const extname = normalizeFileAccessExtname(file.extname);
    const id = extname && fileIdSegment.endsWith(extname) ? fileIdSegment.slice(0, -extname.length) : fileIdSegment;
    return decodeURIComponent(segments[filesIndex + 1]) === appName && id === String(file.id);
  } catch (error) {
    return false;
  }
}

function pathError(message: string) {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = 'PATH_TRAVERSAL';
  return error;
}

function normalizeStoragePathForJoin(value: unknown, message: string, { allowLeadingSlash = false } = {}) {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value !== 'string' || value.includes('\0')) {
    throw pathError(message);
  }
  const normalized = value.replace(/\\/g, '/');
  if (!allowLeadingSlash && normalized.startsWith('/')) {
    throw pathError(message);
  }
  const segments = normalized
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter((segment) => segment && segment !== '.');
  if (segments.some((segment) => segment === '..')) {
    throw pathError('Access denied');
  }
  return segments.join('/');
}

export function normalizeStorageSubPath(subPath?: unknown) {
  return normalizeStoragePathForJoin(subPath, 'Invalid storage sub path');
}

export function resolveStoragePath(storagePath?: unknown, subPath?: unknown) {
  const normalizedSubPath = normalizeStorageSubPath(subPath);
  if (!normalizedSubPath) {
    return typeof storagePath === 'string' ? storagePath : '';
  }
  const normalizedStoragePath = normalizeStoragePathForJoin(storagePath, 'Invalid storage path', {
    allowLeadingSlash: true,
  });
  return normalizedStoragePath ? `${normalizedStoragePath}/${normalizedSubPath}` : normalizedSubPath;
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

function isStorageRelativeDocumentRoot(documentRoot: string): boolean {
  return (
    documentRoot === 'storage' ||
    documentRoot.startsWith('storage/') ||
    documentRoot === './storage' ||
    documentRoot.startsWith('./storage/')
  );
}

export function normalizeDocumentRoot(documentRoot?: string): string {
  if (!documentRoot) {
    return storagePathJoin('uploads');
  }
  // 如果 documentRoot 是绝对路径，直接返回
  if (path.isAbsolute(documentRoot)) {
    return documentRoot;
  }
  const normalizedDocumentRoot = documentRoot.replace(/\\/g, '/');
  // 如果以 storage/ 或 ./storage/ 开头，按 storagePathJoin 处理，不过要去掉开头的 storage 或 ./storage
  if (isStorageRelativeDocumentRoot(normalizedDocumentRoot)) {
    const relativePath = normalizedDocumentRoot.replace(/^\.?\/?storage(?:\/|$)/, '').replace(/^[/\\]+/, '');
    return relativePath ? storagePathJoin(relativePath) : storagePathJoin();
  }
  // 否则按相对路径处理，基于当前工作目录
  return path.resolve(process.cwd(), documentRoot);
}
