/**
 * The test App as a release: a small Node server that honours `APP_BASE_PATH`, `APP_SERVER_PORT` and
 * `APP_CONFIG_FILE`, answers `/api/healthz` (failing when its version contains `broken`), reports its version on `/`,
 * keeps a counter in its storage volume, streams `/stream` as server-sent events and echoes an upgraded connection.
 * `imageContext` writes it with a Dockerfile for a real image; `specFor` makes the Host deployment release management
 * sends a Docker scope.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type {
  HostDeploymentSpec,
  HostImageArtifact,
  HostScope,
} from '@nocobase/app-host';

const SERVER = `
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');
const base = (process.env.APP_BASE_PATH || '').replace(/\\/+$/, '');
const port = Number(process.env.APP_SERVER_PORT || 13000);
const storage = path.resolve(__dirname, '../../storage');
const configFile = process.env.APP_CONFIG_FILE;
const config = configFile && fs.existsSync(configFile) ? fs.readFileSync(configFile, 'utf8') : '';
const broken = pkg.version.includes('broken');
console.log(JSON.stringify({ level: 30, time: Date.now(), msg: 'listening', version: pkg.version, port }));
http.createServer((req, res) => {
  const url = req.url || '/';
  if (!url.startsWith(base + '/') && url !== base) { res.writeHead(404); return res.end('not here'); }
  const route = url.slice(base.length) || '/';
  if (route === '/api/healthz') {
    res.writeHead(broken ? 503 : 200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: !broken }));
  }
  if (route === '/stream') {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.write('data: one\\n\\n');
    return setTimeout(() => res.end('data: two\\n\\n'), 50);
  }
  const counter = path.join(storage, 'counter');
  const count = (fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) : 0) + 1;
  fs.writeFileSync(counter, String(count));
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ version: pkg.version, base, count, config }));
}).on('upgrade', (req, socket) => {
  socket.write('HTTP/1.1 101 Switching Protocols\\r\\nupgrade: echo\\r\\nconnection: Upgrade\\r\\n\\r\\n');
  socket.pipe(socket);
}).listen(port, '0.0.0.0');
process.on('SIGTERM', () => process.exit(0));
`;

export interface TestRelease {
  readonly version: string;
  /** A digest the fake Engine answers for the release's image. */
  readonly digest: string;
}

export function testRelease(version: string): TestRelease {
  return {
    version,
    digest: `sha256:${createHash('sha256').update(version).digest('hex')}`,
  };
}

/** A directory holding the test App at `version` and a Dockerfile, to build its image from. */
export async function imageContext(version: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'app-host-docker-image-'));
  await mkdir(path.join(root, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(root, 'dist', 'package.json'),
    JSON.stringify({ name: 'test-app', version, type: 'commonjs' }),
  );
  await writeFile(path.join(root, 'dist', 'server', 'standalone.js'), SERVER);
  await writeFile(
    path.join(root, 'Dockerfile'),
    [
      'FROM node:24-bookworm-slim',
      'WORKDIR /app',
      'COPY dist/ ./dist/',
      'RUN mkdir -p /app/storage && chown node:node /app/storage',
      'USER node',
      'CMD ["node", "dist/server/standalone.js"]',
      '',
    ].join('\n'),
  );
  return root;
}

/** A Host deployment of `release` as release management sends it to a Docker scope. */
export function specFor(
  appId: string,
  release: TestRelease,
  options: {
    readonly scope: HostScope;
    readonly config?: string | null;
    readonly deploymentId?: string;
    readonly activation?: 'eager' | 'lazy';
    readonly images?: HostImageArtifact[];
    readonly hostname?: string;
    readonly idleStopMs?: number;
    readonly dormantAfterMs?: number;
  },
): HostDeploymentSpec {
  const deploymentId = options.deploymentId ?? randomUUID().replaceAll('-', '');
  return {
    id: appId,
    appId,
    operationId: deploymentId,
    scope: options.scope,
    // An image release has no archive: the artifact only names it, by the digest of what runs.
    artifact: {
      key: '',
      appId,
      version: release.version,
      checksum: release.digest.replace('sha256:', ''),
    },
    desiredState: 'running',
    backend: 'external-service',
    activation: options.activation ?? 'eager',
    idleStopMs: options.idleStopMs ?? 0,
    ...(options.dormantAfterMs
      ? { dormantAfterMs: options.dormantAfterMs }
      : {}),
    ...(options.config === null
      ? {}
      : {
          config: {
            provider: 'file' as const,
            content: options.config ?? `greeting: hello ${release.version}\n`,
            revision: deploymentId,
          },
        }),
    images: options.images ?? [
      {
        ref: `registry.test/team/${appId}`,
        digest: release.digest,
        platform: 'linux/arm64',
      },
    ],
    ...(options.hostname ? { hostname: options.hostname } : {}),
  };
}
