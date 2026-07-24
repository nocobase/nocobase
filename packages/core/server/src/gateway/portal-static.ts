/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to https://www.nocobase.com/agreement.
 */

import { lstat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import type { PortalRequestMatch } from '@nocobase/utils/portal';
import { PortalRequestResolver } from '@nocobase/utils/portal';
import compression from 'compression';
import handler from 'serve-handler';

const compress = promisify(compression());

function endResponse(req: IncomingMessage, res: ServerResponse, statusCode: number, message: string) {
  res.statusCode = statusCode;
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(req.method === 'HEAD' ? undefined : message);
}

function decodePortalPath(relativePath: string) {
  try {
    return decodeURIComponent(relativePath || '/');
  } catch {
    return null;
  }
}

function isUnsafePortalPath(decodedPath: string) {
  if (!decodedPath.startsWith('/') || decodedPath.includes('\0') || decodedPath.includes('\\')) {
    return true;
  }
  return decodedPath.split('/').some((segment) => segment.startsWith('.'));
}

function isPathInside(root: string, candidate: string) {
  const relativePath = path.relative(root, candidate);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath))
  );
}

async function isRegularFile(filePath: string) {
  try {
    return (await lstat(filePath)).isFile();
  } catch {
    return false;
  }
}

function encodePathname(filePath: string) {
  return filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function resolveExistingFile(match: PortalRequestMatch, decodedPath: string) {
  const relativePath = decodedPath.replace(/^\/+/, '');
  const candidate = path.resolve(match.distPath, relativePath);
  if (!isPathInside(match.distPath, candidate)) {
    return null;
  }

  if (await isRegularFile(candidate)) {
    return `/${path.relative(match.distPath, candidate).split(path.sep).join('/')}`;
  }

  try {
    if ((await lstat(candidate)).isDirectory()) {
      const indexPath = path.join(candidate, 'index.html');
      if (await isRegularFile(indexPath)) {
        return `/${path.relative(match.distPath, indexPath).split(path.sep).join('/')}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function acceptsHtml(req: IncomingMessage) {
  return typeof req.headers.accept === 'string' && req.headers.accept.includes('text/html');
}

function canUseSpaFallback(req: IncomingMessage, decodedPath: string) {
  const pathname = decodedPath.replace(/\/+$/, '');
  return (req.method === 'GET' || req.method === 'HEAD') && acceptsHtml(req) && path.posix.extname(pathname) === '';
}

export class PortalStaticServer {
  private readonly resolver: PortalRequestResolver;

  constructor(resolver = new PortalRequestResolver()) {
    this.resolver = resolver;
  }

  clearCache() {
    this.resolver.clearCache();
  }

  async handle(req: IncomingMessage, res: ServerResponse, appPublicPath: string) {
    const match = this.resolver.resolve(req.url || '/', appPublicPath);
    if (!match) {
      return false;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      endResponse(req, res, 405, 'Method Not Allowed');
      return true;
    }

    if (match.relativePath === '') {
      res.statusCode = 302;
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Location', `${match.pathname}/${match.search}`);
      res.end();
      return true;
    }

    const decodedPath = decodePortalPath(match.relativePath);
    if (decodedPath === null) {
      endResponse(req, res, 400, 'Bad Request');
      return true;
    }
    if (isUnsafePortalPath(decodedPath)) {
      endResponse(req, res, 404, 'Not Found');
      return true;
    }

    const existingFile = await resolveExistingFile(match, decodedPath);
    const filePath = existingFile || (canUseSpaFallback(req, decodedPath) ? '/index.html' : null);
    if (!filePath) {
      endResponse(req, res, 404, 'Not Found');
      return true;
    }

    const originalUrl = req.url;
    req.url = `${encodePathname(filePath)}${match.search}`;
    try {
      await compress(req, res);
      await handler(req, res, {
        public: match.distPath,
        cleanUrls: false,
        directoryListing: false,
        symlinks: false,
        headers: [
          {
            source: '**/*',
            headers: [
              { key: 'Cache-Control', value: 'no-cache' },
              { key: 'X-Content-Type-Options', value: 'nosniff' },
            ],
          },
        ],
      });
    } finally {
      req.url = originalUrl;
    }
    return true;
  }
}
