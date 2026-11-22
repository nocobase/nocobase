/**
 * Backs up and restores a real application image through the Docker backend against a real Docker Engine: the image's
 * own `backup` commands run in one-off containers on the App's image, storage volume, network and configuration, the
 * archive lands in the App's backup volume, a later change to its database and uploads is undone by a restore, and the
 * App runs again afterwards.
 *
 * Opt in with `APP_HOST_DOCKER_BACKUP_IT_IMAGE=<local image>`, an image built from an application template's Dockerfile
 * (`docker build --build-arg DIST=prebuilt -t <image> .` in `packages/templates/app-template-default` after
 * `pnpm build`) (`pnpm test:docker:backup`). It pulls `registry:2` to serve the image by digest. Override the socket
 * with `APP_HOST_DOCKER_SOCKET` and the ports from `APP_HOST_DOCKER_PORT` (14400). Everything it creates is named
 * `app-host-docker-backup-it-*` and removed afterwards.
 */
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  FileOperationLog,
  createAppHost,
  type AppHost,
  type HostDeploymentSpec,
  type HostScope,
} from '@nocobase/app-host';
import Docker from 'dockerode';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDockerBackend } from '../src/backend.js';
import { DOCKER_DEFAULT_SETTINGS } from '../src/config.js';
import { LABEL } from '../src/naming.js';

const IMAGE = process.env.APP_HOST_DOCKER_BACKUP_IT_IMAGE;
const SOCKET = process.env.APP_HOST_DOCKER_SOCKET ?? '/var/run/docker.sock';
const PORT = Number(process.env.APP_HOST_DOCKER_PORT ?? 14400);
const REGISTRY_PORT = PORT + 2;
const PREFIX = 'app-host-docker-backup-it-';
const SCOPE_ID = `it-${randomUUID().slice(0, 8)}`;
const REPOSITORY = `127.0.0.1:${REGISTRY_PORT}/it/app`;

const docker = new Docker({ socketPath: SOCKET });

let dir: string;
let host: AppHost;
let digest: string;
let platform: string;

const CONFIG = `secrets:
  keys:
    - version: 1
      key: ${randomUUID()}
users:
  initialAdmin:
    username: nocobase
    email: admin@nocobase.com
    password: admin123-${randomUUID().slice(0, 8)}
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: database.sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
`;

function scope(): HostScope {
  return {
    id: SCOPE_ID,
    backend: 'docker',
    backendConfig: {},
    secret: {
      registryAuth: { serveraddress: `127.0.0.1:${REGISTRY_PORT}` },
    },
  };
}

function deployment(operationId: string): HostDeploymentSpec {
  return {
    id: 'shop',
    appId: 'shop',
    operationId,
    scope: scope(),
    artifact: {
      key: '',
      appId: 'shop',
      version: 'it',
      checksum: digest.replace('sha256:', ''),
    },
    desiredState: 'running',
    backend: 'external-service',
    activation: 'eager',
    idleStopMs: 0,
    config: { provider: 'file', content: CONFIG, revision: 'c-1' },
    images: [{ ref: REPOSITORY, digest, platform }],
  };
}

async function follow(
  stream: NodeJS.ReadableStream,
): Promise<{ aux?: { Digest?: string }; status?: string; error?: string }[]> {
  const output = await new Promise<
    { aux?: { Digest?: string }; status?: string; error?: string }[]
  >((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (error: Error | null, result: unknown[]) =>
        error ? reject(error) : resolve(result as never),
    );
  });
  const failed = output.find((item) => item.error);
  if (failed) throw new Error(failed.error);
  return output;
}

/** Runs `script` with Node in a container of the image on the App's storage volume; answers its output. */
async function inStorage(script: string): Promise<string> {
  const [app] = await docker.listContainers({
    all: true,
    filters: { label: [`${LABEL.app}=shop`, `${LABEL.scope}=${SCOPE_ID}`] },
  });
  const volume = (await docker.getContainer(app!.Id).inspect()).Mounts.find(
    (mount) => mount.Destination === DOCKER_DEFAULT_SETTINGS.storagePath,
  )!.Name!;
  const container = await docker.createContainer({
    name: `${PREFIX}probe-${randomUUID().slice(0, 8)}`,
    Image: app!.Image,
    Cmd: ['node', '-e', script],
    HostConfig: {
      Mounts: [
        {
          Type: 'volume',
          Source: volume,
          Target: DOCKER_DEFAULT_SETTINGS.storagePath,
        },
      ],
    },
  });
  try {
    await container.start();
    const { StatusCode } = (await container.wait()) as { StatusCode: number };
    const frames = await container.logs({ stdout: true, stderr: true });
    // Docker multiplexes the streams: an 8-byte header (stream, 0, 0, 0, size) before each frame.
    const streams = { 1: '', 2: '' } as Record<number, string>;
    for (let offset = 0; offset + 8 <= frames.length;) {
      const size = frames.readUInt32BE(offset + 4);
      streams[frames[offset]!] =
        (streams[frames[offset]!] ?? '') +
        frames.subarray(offset + 8, offset + 8 + size).toString('utf8');
      offset += 8 + size;
    }
    const logs = StatusCode === 0 ? streams[1]! : `${streams[1]}${streams[2]}`;
    if (StatusCode !== 0) throw new Error(logs);
    return logs.trim();
  } finally {
    await container.remove({ force: true });
  }
}

const MARKER = (value?: string) => `
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const db = new DatabaseSync('/app/storage/database.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS it_marker (value TEXT)');
${value === undefined ? '' : `db.exec('DELETE FROM it_marker'); db.prepare('INSERT INTO it_marker VALUES (?)').run(${JSON.stringify(value)});`}
${value === undefined ? '' : `fs.mkdirSync('/app/storage/uploads', { recursive: true }); fs.writeFileSync('/app/storage/uploads/${value}.txt', ${JSON.stringify(value)});`}
const uploads = fs.existsSync('/app/storage/uploads') ? fs.readdirSync('/app/storage/uploads').filter((name) => name.endsWith('.txt')).sort() : [];
console.log(JSON.stringify({ marker: db.prepare('SELECT value FROM it_marker').get()?.value ?? null, uploads }));
db.close();
`;

async function cleanup(): Promise<void> {
  for (const container of await docker.listContainers({ all: true }))
    if (
      container.Names.some((name) => name.startsWith(`/${PREFIX}`)) ||
      container.Labels[LABEL.scope] === SCOPE_ID
    )
      await docker
        .getContainer(container.Id)
        .remove({ force: true, v: true })
        .catch(() => undefined);
  for (const image of await docker.listImages())
    for (const tag of [...(image.RepoTags ?? []), ...(image.RepoDigests ?? [])])
      if (
        tag.startsWith(PREFIX) ||
        tag.startsWith(`127.0.0.1:${REGISTRY_PORT}/`)
      )
        await docker
          .getImage(tag)
          .remove({ force: true, noprune: true })
          .catch(() => undefined);
  const { Volumes } = await docker.listVolumes();
  for (const volume of Volumes ?? [])
    if (volume.Name.startsWith(PREFIX))
      await docker
        .getVolume(volume.Name)
        .remove()
        .catch(() => undefined);
  for (const network of await docker.listNetworks())
    if (network.Name.startsWith(PREFIX))
      await docker
        .getNetwork(network.Id)
        .remove()
        .catch(() => undefined);
}

describe.runIf(IMAGE)(
  'backups through the Docker backend against Docker',
  () => {
    beforeAll(async () => {
      await docker.ping();
      await cleanup();
      await follow(await docker.pull('registry:2'));
      const registry = await docker.createContainer({
        name: `${PREFIX}registry`,
        Image: 'registry:2',
        HostConfig: {
          PortBindings: {
            '5000/tcp': [
              { HostIp: '127.0.0.1', HostPort: String(REGISTRY_PORT) },
            ],
          },
        },
      });
      await registry.start();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const version = await docker.version();
      platform = `${version.Os}/${({ aarch64: 'arm64', x86_64: 'amd64' } as Record<string, string>)[version.Arch] ?? version.Arch}`;
      await docker.getImage(IMAGE!).tag({ repo: REPOSITORY, tag: 'it' });
      const output = await follow(
        await docker.getImage(`${REPOSITORY}:it`).push({
          authconfig: { serveraddress: `127.0.0.1:${REGISTRY_PORT}` },
        }),
      );
      // An Engine answers the digest as `aux` or only in its final status line.
      const pushed =
        output.find((item) => item.aux?.Digest)?.aux?.Digest ??
        output
          .map(
            (item) =>
              /digest: (sha256:[0-9a-f]{64})/.exec(item.status ?? '')?.[1],
          )
          .find(Boolean);
      if (!pushed) throw new Error('The registry answered no digest.');
      digest = pushed;
      dir = await mkdtemp(path.join(os.tmpdir(), PREFIX));
      host = createAppHost({
        mode: 'managed',
        port: 0,
        appRevisionsDir: path.join(dir, 'revisions'),
        appVolumesDir: path.join(dir, 'volumes'),
        artifact: {
          driver: 'fs',
          location: path.join(dir, 'artifacts'),
          visibility: 'private',
        },
        evictionIntervalMs: 0,
        operations: new FileOperationLog(path.join(dir, 'control')),
        backends: [
          createDockerBackend({
            pollIntervalMs: 500,
            endpoint: `unix://${SOCKET}`,
            settings: {
              ...DOCKER_DEFAULT_SETTINGS,
              namePrefix: PREFIX,
              image: { platform: null, keep: 1 },
              healthCheck: {
                path: '/api/healthz',
                timeoutSeconds: 120,
                intervalSeconds: 2,
              },
              stopTimeoutSeconds: 10,
            },
          }),
        ],
      });
      await host.start();
    }, 600_000);

    afterAll(async () => {
      await host?.close('test end').catch(() => undefined);
      await cleanup();
      if (dir) await rm(dir, { recursive: true, force: true });
    }, 120_000);

    it('backs a running SQLite App up in a one-off container and restores its database and uploads', async () => {
      const service = host.management;
      const first = await service.applyDeployment(deployment('d-1'));
      expect(first.deployments[0]).toMatchObject({ observedState: 'running' });
      const described = await service.describeHost();
      expect(
        described.backends.find((backend) => backend.name === 'docker'),
      ).toMatchObject({ capabilities: { backup: true } });
      expect(JSON.parse(await inStorage(MARKER('before')))).toEqual({
        marker: 'before',
        uploads: ['before.txt'],
      });

      const backup = await service.createBackup!('shop', {
        operationId: 'b-1',
        scope: scope(),
      });
      expect(backup).toMatchObject({
        backupId: 'b-1',
        appId: 'shop',
        complete: true,
        manifest: {
          online: true,
          connections: [{ name: 'main', dialect: 'sqlite', mode: 'dump' }],
          disks: [expect.objectContaining({ mode: 'files' })],
          limitations: [],
        },
      });
      expect(backup.size).toBeGreaterThan(0);
      // Asked again, the finished backup answers without running.
      await expect(
        service.createBackup!('shop', { operationId: 'b-1', scope: scope() }),
      ).resolves.toEqual(backup);
      // The command containers are gone.
      expect(
        await docker.listContainers({
          all: true,
          filters: { name: [`${PREFIX}shop-command`] },
        }),
      ).toEqual([]);

      expect(JSON.parse(await inStorage(MARKER('after')))).toEqual({
        marker: 'after',
        uploads: ['after.txt', 'before.txt'],
      });
      const restored = await service.restoreBackup!('shop', {
        operationId: 'r-1',
        scope: scope(),
        backupId: 'b-1',
        sha256: backup.sha256,
        deployment: deployment('r-1'),
      });
      expect(restored.status.deployments).toMatchObject([
        { appId: 'shop', observedState: 'running' },
      ]);
      expect(restored.restore).toMatchObject({
        connections: [{ name: 'main', status: 'restored' }],
      });
      expect(JSON.parse(await inStorage(MARKER()))).toEqual({
        marker: 'before',
        uploads: ['before.txt'],
      });

      // A wrong checksum fails the restore with the command's own code, and the App is left stopped.
      const failed = await service.restoreBackup!('shop', {
        operationId: 'r-2',
        scope: scope(),
        backupId: 'b-1',
        sha256: '0'.repeat(64),
        deployment: deployment('r-2'),
      }).catch((error: unknown) => error);
      expect(failed).toMatchObject({ code: 'BACKUP_DIGEST_MISMATCH' });
      await expect(
        service.getOperation('r-2', { scope: scope() }),
      ).resolves.toMatchObject({
        kind: 'restore',
        state: 'failed',
        errorCode: 'BACKUP_DIGEST_MISMATCH',
      });

      await expect(
        service.deleteBackup!('shop', 'b-1', { scope: scope() }),
      ).resolves.toEqual({ deleted: true });
      await expect(
        service.deleteBackup!('shop', 'b-1', { scope: scope() }),
      ).resolves.toEqual({ deleted: false });
    }, 900_000);
  },
);
