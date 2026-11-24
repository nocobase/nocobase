import path from 'node:path';

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export function contentTypeFor(filePath: string): string {
  return (
    contentTypes[path.extname(filePath).toLowerCase()] ??
    'application/octet-stream'
  );
}

/** Text types worth sending compressed; images, fonts and archives are compressed already. */
export function isCompressibleType(contentType: string): boolean {
  return /^(?:text\/|application\/(?:json|wasm)|image\/svg\+xml)/u.test(
    contentType,
  );
}
