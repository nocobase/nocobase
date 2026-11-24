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

/** The encodings an `Accept-Encoding` header accepts: those it lists without `q=0`, and every one for `*`. */
export function acceptedEncodings(header: string | null): Set<string> {
  const accepted = new Set<string>();
  for (const part of header?.split(',') ?? []) {
    const [name, ...parameters] = part.trim().toLowerCase().split(';');
    const quality = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith('q='));
    if (!name || (quality && Number(quality.slice(2)) === 0)) continue;
    if (name === '*')
      for (const { encoding } of precompressed) accepted.add(encoding);
    else accepted.add(name);
  }
  return accepted;
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
    const accepted = acceptedEncodings(options.acceptEncoding ?? null);
    for (const { encoding, extension } of precompressed) {
      if (!accepted.has(encoding)) continue;
      const compressed = await fileStats(`${filePath}${extension}`);
      if (!compressed) continue;
      headers.set('content-encoding', encoding);
      servedPath = `${filePath}${extension}`;
      servedSize = compressed.size;
      break;
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
