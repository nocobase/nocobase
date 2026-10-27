import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  preserveSampleAssets,
  resolveSampleRequest,
  sampleIds,
  validateSampleIds,
} from './routing.mjs';

// This entry is copied only into an acceptance archive, next to carrier-embedded.js.
export async function createServer(scope) {
  const { createServer: createCarrier } = await import('./carrier-embedded.js');
  const carrier = await createCarrier(scope);
  const manifest = JSON.parse(
    await readFile(
      new URL('../acceptance/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  validateSampleIds(manifest.samples);
  if (sampleIds.some((id) => !manifest.samples?.[id]?.target)) {
    throw new Error(
      'Acceptance preview requires provenance for both new samples',
    );
  }
  const origin = carrier.config.get('app.publicOrigin');
  if (!origin || !scope.dataDir || !scope.rootDir) {
    throw new Error(
      'Acceptance preview requires a public origin and persistent host paths',
    );
  }
  const admin = carrier.config.get('users.initialAdmin');
  const keys = carrier.config.get('secrets.keys');
  const keyMaterial = keys?.length ? keys : carrier.config.get('auth.secret');
  if (!admin?.password || !keyMaterial) {
    throw new Error(
      'Acceptance preview requires native initial administrator and signing configuration',
    );
  }
  const children = new Map();
  const disposers = [];
  let disposed = false;
  async function dispose() {
    if (disposed) return;
    disposed = true;
    const errors = [];
    for (const callback of disposers.reverse()) {
      try {
        await callback();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Acceptance preview shutdown failed');
  }
  scope.registerDisposer('acceptance-applications', dispose);
  try {
    for (const id of sampleIds) {
      const rootDir = path.join(scope.rootDir, 'dist', 'acceptance', id);
      const dataDir = path.join(scope.dataDir, 'acceptance', id);
      await mkdir(dataDir, { recursive: true });
      const basePath = `${scope.basePath.replace(/\/$/, '')}/acceptance/${id}`;
      const { createServer: createChild } = await import(
        pathToFileURL(path.join(rootDir, 'dist/server/embedded.js')).href
      );
      const child = await createChild({
        id: `${scope.id}-${id}`,
        appName: `${scope.appName || scope.id}-${id}`,
        mode: 'embedded',
        version: scope.version,
        rootDir,
        dataDir,
        basePath,
        assetsBasePath: `${basePath}/assets`,
        signal: scope.signal,
        logging: scope.logging,
        // Do not inherit outer database, storage, config-file or transport settings.
        env: {
          NODE_ENV: 'production',
          NOCOBASE_STRICT_STARTUP: 'true',
          APP_PUBLIC_ORIGIN: origin,
          INITIAL_ADMIN_USERNAME: admin.username,
          INITIAL_ADMIN_EMAIL: admin.email,
          INITIAL_ADMIN_PASSWORD: admin.password,
          SECRETS_KEYS: `1:${createHash('sha256').update(JSON.stringify(keyMaterial)).update(id).digest('hex')}`,
        },
        registerDisposer(_name, callback) {
          disposers.push(callback);
        },
        onBeforeDestroy: scope.onBeforeDestroy?.bind(scope),
      });
      children.set(id, { child, basePath });
    }
  } catch (error) {
    await dispose();
    throw error;
  }
  return {
    config: carrier.config,
    async fetch(request, ...args) {
      if (
        ['/acceptance', '/acceptance/'].includes(new URL(request.url).pathname)
      ) {
        const escape = (value) =>
          String(value).replace(
            /[&<>"']/g,
            (char) =>
              ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
              })[char],
          );
        const links = sampleIds
          .map((id) => {
            const sample = manifest.samples[id];
            return `<li><a href="${escape(`${scope.basePath}/acceptance/${id}/`)}">${escape(id)}</a> — New application · Template ${escape(sample.target)}</li>`;
          })
          .join('');
        return new Response(
          `<!doctype html><html lang="en"><meta charset="utf-8"><title>List recovery samples</title><h1>Equipment loan acceptance samples</h1><p>Each sample has its own native sign-in and synthetic data. Use Equipment loans → Active loans after signing in.</p><ul>${links}</ul></html>`,
          {
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'no-store',
            },
          },
        );
      }
      const match = resolveSampleRequest(request);
      if (!match) return carrier.fetch(request, ...args);
      const { child, basePath } = children.get(match.id);
      const response = await child.fetch(match.request, ...args);
      return preserveSampleAssets(response, origin, basePath);
    },
    async websocket(request, ...args) {
      const match = resolveSampleRequest(request);
      if (!match) return carrier.websocket?.(request, ...args);
      return children.get(match.id).child.websocket?.(match.request, ...args);
    },
  };
}

export default createServer;
