import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { contentTypeFor, isCompressibleType } from './content-types.js';

const oneYearSeconds = 31_536_000;

export interface ServeSpaAssetOptions {
  rootDir: string;
  basePath: string;
  cacheControl?: string;
}

export async function serveSpaAsset(
  request: Request,
  options: ServeSpaAssetOptions,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return methodNotAllowed('GET, HEAD');
  }

  const requestUrl = new URL(request.url);
  const pathInsideRoot = getPathInsideRoot(
    requestUrl.pathname,
    options.basePath,
  );
  const response = await serveFileIfExists(
    options.rootDir,
    pathInsideRoot,
    request.method,
    {
      cacheControl:
        options.cacheControl ?? `public, max-age=${oneYearSeconds}, immutable`,
      acceptEncoding: request.headers.get('accept-encoding'),
    },
  );

  return response ?? notFound();
}

// The copies the build writes beside each compressible asset (`precompressAssets` in `@nocobase/dev-config`), in the
// order they are preferred.
const precompressed = [
  { encoding: 'br', extension: '.br' },
  { encoding: 'gzip', extension: '.gz' },
] as const;

/**
 * The weights an `Accept-Encoding` header gives each coding (RFC 9110 section 12.5.3), by lowercase name; `*` stands
 * for the codings it does not name. A coding without a valid `q` weighs 1.
 */
function parseAcceptEncoding(header: string | null): Map<string, number> {
  const weights = new Map<string, number>();
  for (const part of header?.split(',') ?? []) {
    const [rawName, ...parameters] = part.split(';');
    const name = rawName.trim().toLowerCase();
    if (!name) continue;
    let weight = 1;
    for (const parameter of parameters) {
      const match = /^\s*q\s*=\s*(\d*\.?\d*)\s*$/i.exec(parameter);
      if (match && match[1] !== '' && match[1] !== '.')
        weight = Math.min(1, Number(match[1]));
    }
    weights.set(name, weight);
  }
  return weights;
}

/** The weight a header gives a coding: its own, else that of `*`, else 0 (not accepted). */
function weightOf(weights: Map<string, number>, encoding: string): number {
  return weights.get(encoding) ?? weights.get('*') ?? 0;
}

/** Whether the file itself, without a coding, is acceptable: unless `identity;q=0`, or `*;q=0` naming no `identity`. */
function identityAccepted(weights: Map<string, number>): boolean {
  return (weights.get('identity') ?? weights.get('*') ?? 1) > 0;
}

async function fileStats(
  filePath: string,
): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    const stats = await stat(filePath);
    return stats.isFile() ? stats : null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return null;
    throw error;
  }
}

async function serveFileIfExists(
  rootDir: string,
  requestPath: string,
  method: string,
  options: { cacheControl?: string; acceptEncoding?: string | null } = {},
): Promise<Response | null> {
  const filePath = resolveSpaFile(rootDir, requestPath);
  if (!filePath) {
    return null;
  }

  const stats = await fileStats(filePath);
  if (!stats) {
    return null;
  }

  const contentType = contentTypeFor(filePath);
  const headers = new Headers({
    'cache-control': options.cacheControl ?? 'no-cache',
    'content-type': contentType,
    'last-modified': stats.mtime.toUTCString(),
  });

  let servedPath = filePath;
  let servedSize = stats.size;
  if (isCompressibleType(contentType)) {
    // Caches keep one copy per encoding, also of a file served uncompressed to a client that accepts none.
    headers.set('vary', 'accept-encoding');
    const weights = parseAcceptEncoding(options.acceptEncoding ?? null);
    // The heaviest weight wins, `precompressed` order breaks a tie, and a copy the build did not write is skipped.
    let bestWeight = 0;
    for (const { encoding, extension } of precompressed) {
      const weight = weightOf(weights, encoding);
      if (weight <= bestWeight) continue;
      const copy = await fileStats(`${filePath}${extension}`);
      if (!copy) continue;
      bestWeight = weight;
      headers.set('content-encoding', encoding);
      servedPath = `${filePath}${extension}`;
      servedSize = copy.size;
    }
    if (bestWeight === 0 && !identityAccepted(weights)) {
      return notAcceptable(headers.get('vary')!);
    }
  }
  headers.set('content-length', String(servedSize));

  const body =
    method === 'HEAD'
      ? null
      : (Readable.toWeb(createReadStream(servedPath)) as ConstructorParameters<
          typeof Response
        >[0]);
  return new Response(body, { headers });
}

function getPathInsideRoot(pathname: string, basePath: string): string {
  const pathInside =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length)
      : pathname;
  return pathInside.startsWith('/') ? pathInside : `/${pathInside}`;
}

function resolveSpaFile(rootDir: string, requestPath: string): string | null {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  if (decodedPath.includes('\0')) {
    return null;
  }

  const normalizedPath = decodedPath.replace(/^\/+/, '');
  const filePath = path.resolve(rootDir, normalizedPath);
  const relative = path.relative(rootDir, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return filePath;
}

function methodNotAllowed(allow: string): Response {
  return Response.json(
    {
      error: 'Method not allowed',
    },
    {
      status: 405,
      headers: {
        allow,
      },
    },
  );
}

function notFound(): Response {
  return Response.json(
    {
      error: 'Not found',
    },
    {
      status: 404,
    },
  );
}

function notAcceptable(vary: string): Response {
  return Response.json(
    {
      error: 'Not acceptable',
    },
    {
      status: 406,
      headers: {
        vary,
      },
    },
  );
}
