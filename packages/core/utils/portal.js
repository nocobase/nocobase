/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to https://www.nocobase.com/agreement.
 */

const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('node:url');

const DEFAULT_PORTAL_CACHE_TTL_MS = 1000;
const PORTAL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DEFAULT_RESERVED_PORTAL_NAMES = Object.freeze([
  'admin',
  'api',
  'apps',
  'dist',
  'files',
  'forgot-password',
  'mobile',
  'reset-password',
  'signin',
  'signup',
  'static',
  'storage',
  'ws',
]);

function resolvePortalStorageRoot() {
  const storagePath = process.env.STORAGE_PATH;
  if (!storagePath) {
    return path.resolve(process.cwd(), 'storage');
  }
  return path.isAbsolute(storagePath) ? storagePath : path.resolve(process.cwd(), storagePath);
}

function normalizePortalPublicPath(value = '/') {
  let normalized = value || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/+/g, '/');
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

function getFirstPathSegment(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .split('/')[0];
}

function getPortalReservedNames(env = process.env) {
  const names = new Set(DEFAULT_RESERVED_PORTAL_NAMES);
  const configuredNames = [env.API_BASE_PATH, env.WS_PATH, env.APP_MODERN_CLIENT_PREFIX || 'v'];

  for (const value of configuredNames) {
    const name = getFirstPathSegment(value);
    if (PORTAL_NAME_PATTERN.test(name)) {
      names.add(name);
    }
  }

  return names;
}

class PortalRequestResolver {
  constructor(options = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_PORTAL_CACHE_TTL_MS;
    this.getStorageRoot = options.getStorageRoot || resolvePortalStorageRoot;
    this.now = options.now || Date.now;
    this.reservedNames = new Set(options.reservedNames || []);
    this.cache = new Map();
  }

  clearCache() {
    this.cache.clear();
  }

  resolve(requestUrl, appPublicPath = '/', options = {}) {
    const parsedUrl = parse(requestUrl || '/');
    const pathname = parsedUrl.pathname || '/';
    const search = parsedUrl.search || '';
    const publicPath = normalizePortalPublicPath(appPublicPath);
    if (!pathname.startsWith(publicPath)) {
      return null;
    }

    const restPath = pathname.slice(publicPath.length);
    if (!restPath) {
      return null;
    }

    const separatorIndex = restPath.indexOf('/');
    const portalName = separatorIndex === -1 ? restPath : restPath.slice(0, separatorIndex);
    if (!PORTAL_NAME_PATTERN.test(portalName)) {
      return null;
    }

    const reservedNames = getPortalReservedNames();
    for (const name of this.reservedNames) {
      reservedNames.add(name);
    }
    for (const name of options.reservedNames || []) {
      reservedNames.add(name);
    }
    if (reservedNames.has(portalName)) {
      return null;
    }

    const storageRoot = this.getStorageRoot();
    const portalRoot = path.join(storageRoot, 'portals', portalName);
    const distPath = path.join(portalRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (!this.hasPortal(indexPath)) {
      return null;
    }

    return {
      portalName,
      portalRoot,
      distPath,
      indexPath,
      pathname,
      search,
      publicPath,
      relativePath: separatorIndex === -1 ? '' : restPath.slice(separatorIndex),
    };
  }

  hasPortal(indexPath) {
    const now = this.now();
    const cached = this.cache.get(indexPath);
    if (cached && cached.expiresAt > now) {
      return cached.exists;
    }

    let exists = false;
    try {
      exists = fs.lstatSync(indexPath).isFile();
    } catch {
      exists = false;
    }

    this.cache.set(indexPath, {
      exists,
      expiresAt: now + this.cacheTtlMs,
    });
    return exists;
  }
}

module.exports = {
  DEFAULT_PORTAL_CACHE_TTL_MS,
  DEFAULT_RESERVED_PORTAL_NAMES,
  PORTAL_NAME_PATTERN,
  PortalRequestResolver,
  getPortalReservedNames,
  normalizePortalPublicPath,
  resolvePortalStorageRoot,
};
