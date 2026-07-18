/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, preview } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDir, '../../../../../../../..');
const base = normalizeBase(process.env.BROWSER_PREVIEW_E2E_BASE || '/');
const port = Number(process.env.BROWSER_PREVIEW_E2E_PORT || 43110);
const outDir = path.join(currentDir, `.dist-${port}`);
const cacheDir = path.join(currentDir, `.vite-${port}`);
const wasmPath = path.resolve(repositoryRoot, 'node_modules/esbuild-wasm/esbuild.wasm');
const wasm = fs.readFileSync(wasmPath);
const cspAllowed = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "connect-src 'self' ws: wss:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "frame-src 'self' blob:",
].join('; ');
const cspBlocked = cspAllowed.replace(" 'wasm-unsafe-eval'", '');

const deploymentPlugin = {
  name: 'light-extension-browser-preview-deployment-e2e',
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
      response.setHeader(
        'Content-Security-Policy',
        url.searchParams.get('csp') === 'blocked' ? cspBlocked : cspAllowed,
      );
      if (!url.pathname.startsWith(`${base}test-assets/`)) {
        next();
        return;
      }
      if (url.pathname.endsWith('/missing.wasm')) {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end('missing');
        return;
      }
      response.statusCode = 200;
      response.setHeader(
        'Content-Type',
        url.pathname.endsWith('/wrong-mime.wasm') ? 'text/html; charset=utf-8' : 'application/wasm',
      );
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      response.end(wasm);
    });
  },
};

if (process.env.BROWSER_PREVIEW_E2E_SKIP_BUILD !== '1' || !fs.existsSync(path.join(outDir, 'index.html'))) {
  await build({
    root: currentDir,
    base,
    cacheDir,
    plugins: [deploymentPlugin],
    resolve: {
      alias: {
        '@nocobase/runjs/compiler/portable': path.resolve(
          repositoryRoot,
          'packages/core/runjs/src/compiler/portable.ts',
        ),
      },
    },
    build: {
      emptyOutDir: true,
      outDir,
    },
  });
}

const server = await preview({
  root: currentDir,
  base,
  cacheDir,
  plugins: [deploymentPlugin],
  resolve: {
    alias: {
      '@nocobase/runjs/compiler/portable': path.resolve(repositoryRoot, 'packages/core/runjs/src/compiler/portable.ts'),
    },
  },
  build: { outDir },
  preview: {
    host: '127.0.0.1',
    port,
    strictPort: true,
  },
});

const close = async () => {
  await server.httpServer.close();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  process.exit(0);
};

process.on('SIGINT', close);
process.on('SIGTERM', close);

function normalizeBase(value) {
  const normalized = `/${String(value || '/').replace(/^\/+|\/+$/gu, '')}/`;
  return normalized === '//' ? '/' : normalized;
}
