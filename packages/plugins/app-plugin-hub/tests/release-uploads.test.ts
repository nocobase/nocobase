// @vitest-environment node
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApiKeyService } from '@nocobase/app-plugin-api-keys/server';
import {
  authenticationToken,
  createAuthentication,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { c as createTar } from 'tar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hubApiKeyAuthentication,
  HUB_API_KEY_CONFIG_ID,
} from '../server/api-key-auth.js';
import { registerHubResources } from '../server/authorization.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  HubApiKeyService,
  hubApiKeyServiceToken,
} from '../server/services/api-keys.js';
import {
  DefaultHubService,
  type HubHostController,
} from '../server/services/hub.js';
import {
  MAX_RESUMABLE_ARTIFACT_SIZE,
  RELEASE_UPLOAD_CHUNK_SIZE,
  RELEASE_UPLOAD_SWEEP_INTERVAL_MS,
  RELEASE_UPLOAD_TTL_MS,
} from '../server/services/release-uploads.js';
import { hubServiceToken } from '../server/tokens.js';

const SECRET = 'test-only-auth-secret-at-least-32-characters';

interface UploadBody {
  readonly uploadId: string;
  readonly offset: number;
  readonly size: number;
  readonly chunkSize?: number;
  readonly expiresAt: string;
}

let root: string;
let uploadsDir: string;
let testDatabase: TestDatabase;
let db: DatabaseManager;
let hub: DefaultHubService;
let api: Awaited<ReturnType<typeof apiRoutes.createRouter>>;
let uploader: string;
let deployer: string;
let archive: Buffer;
let checksum: string;

async function migrate(packageName: string, directory: string) {
  return createMigrator({
    database: db,
    packageName,
    directory: fileURLToPath(new URL(directory, import.meta.url)),
  }).latest();
}

async function buildArchive(version: string): Promise<Buffer> {
  const project = await mkdtemp(path.join(root, 'project-'));
  await mkdir(path.join(project, 'dist/server'), { recursive: true });
  await writeFile(
    path.join(project, 'dist/package.json'),
    JSON.stringify({ version, nocobase: { relocatable: true } }),
  );
  await writeFile(path.join(project, 'dist/server/embedded.js'), '');
  const file = path.join(project, 'dist.tar.gz');
  await createTar({ cwd: project, file, gzip: true }, ['dist']);
  return await readFile(file);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function auth(key: string = uploader): Record<string, string> {
  return { authorization: `Bearer ${key}` };
}

function start(
  body: unknown,
  { app = 'crm', key = uploader }: { app?: string; key?: string } = {},
) {
  return api.request(`/hub/apps/${app}/releases/uploads`, {
    method: 'POST',
    headers: { ...auth(key), 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function startUpload(
  bytes: Uint8Array = archive,
  digest: string = sha256(bytes),
): Promise<UploadBody> {
  const response = await start({ size: bytes.byteLength, sha256: digest });
  expect(response.status).toBe(201);
  return ((await response.json()) as { data: { upload: UploadBody } }).data
    .upload;
}

function put(
  uploadId: string,
  offset: number,
  bytes: Uint8Array,
  {
    app = 'crm',
    key = uploader,
    headers = {},
  }: {
    app?: string;
    key?: string;
    headers?: Record<string, string>;
  } = {},
) {
  return api.request(`/hub/apps/${app}/releases/uploads/${uploadId}`, {
    method: 'PUT',
    headers: {
      ...auth(key),
      'content-type': 'application/octet-stream',
      'content-length': String(bytes.byteLength),
      'upload-offset': String(offset),
      ...headers,
    },
    body: bytes,
  });
}

function status(uploadId: string, { app = 'crm', key = uploader } = {}) {
  return api.request(`/hub/apps/${app}/releases/uploads/${uploadId}`, {
    headers: auth(key),
  });
}

function complete(
  uploadId: string,
  { app = 'crm', headers = {} }: { app?: string; headers?: object } = {},
) {
  return api.request(`/hub/apps/${app}/releases/uploads/${uploadId}/complete`, {
    method: 'POST',
    headers: { ...auth(), ...headers },
  });
}

async function sendAll(uploadId: string, bytes: Uint8Array = archive) {
  const middle = Math.floor(bytes.byteLength / 2);
  expect((await put(uploadId, 0, bytes.subarray(0, middle))).status).toBe(200);
  const last = await put(uploadId, middle, bytes.subarray(middle));
  expect(last.status).toBe(200);
  return last;
}

async function errorOf(response: Response) {
  return ((await response.json()) as { error: Record<string, unknown> }).error;
}

async function sessionDirs(app = 'crm'): Promise<readonly string[]> {
  try {
    return await readdir(path.join(uploadsDir, app));
  } catch {
    return [];
  }
}

function sessionDir(uploadId: string, app = 'crm'): string {
  return path.join(uploadsDir, app, uploadId);
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-release-uploads-'));
  uploadsDir = path.join(root, 'uploads');
  testDatabase = await createTestDatabase();
  db = testDatabase.database;
  await migrate(
    '@nocobase/app-plugin-authentication',
    '../../app-plugin-authentication/database/migrations',
  );
  await migrate(
    '@nocobase/app-plugin-authorization',
    '../../app-plugin-authorization/database/migrations',
  );
  await migrate(
    '@nocobase/app-plugin-api-keys',
    '../../app-plugin-api-keys/database/migrations',
  );
  await migrate('@nocobase/app-plugin-hub', '../database/migrations');
  const connection = db.connection();
  const authorization = createAppAuthorization({ connection });
  registerHubResources(authorization, connection);
  const now = new Date();
  await connection.query
    .insertInto('user')
    .values({
      id: 'admin',
      name: 'admin',
      email: 'admin@example.com',
      username: 'admin',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      disabledAt: null,
    })
    .execute();
  await authorization.permissionSets.assign({
    subject: { type: 'user', id: 'admin' },
    permissionSet: 'hub-administrator',
  });
  for (const id of ['crm', 'erp'])
    await connection.query
      .insertInto('hubApps')
      .values({
        id,
        name: id,
        enabled: false,
        basePath: `/${id}`,
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  const authentication = createAuthentication({
    connection,
    secret: SECRET,
    plugins: hubApiKeyAuthentication(),
  });
  const apiKeys = new HubApiKeyService(
    db,
    authorization,
    new ApiKeyService(authentication, HUB_API_KEY_CONFIG_ID),
    SECRET,
  );
  hub = new DefaultHubService({
    database: db,
    // No Host status is readable, so uploads skip the build-target check.
    hostController: {
      getManagementClient: () => Promise.reject(new Error('No Host')),
      removeDeployment: () => Promise.resolve({ deployments: [] }),
    } as unknown as HubHostController,
    config: {
      uploadsDir,
      artifact: {
        driver: 'fs',
        location: path.join(root, 'artifacts'),
        visibility: 'private',
      },
      host: {
        enabled: true,
        driver: 'tsx',
        appRevisionsDir: path.join(root, 'revisions'),
        appVolumesDir: path.join(root, 'volumes'),
        configPath: path.join(root, 'host.yml'),
      },
    },
  });
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, authorization);
  container.instance(hubApiKeyServiceToken, apiKeys);
  container.instance(hubServiceToken, hub);
  api = await apiRoutes.createRouter({ container } as AppPluginApplication);
  uploader = (
    await apiKeys.create('admin', {
      name: 'Upload',
      appIds: ['crm', 'erp'],
      scopes: ['upload-release'],
    })
  ).secret;
  deployer = (
    await apiKeys.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    })
  ).secret;
  archive = await buildArchive('1.0.0');
  checksum = sha256(archive);
});

afterEach(async () => {
  await testDatabase.destroy();
  await rm(root, { recursive: true, force: true });
});

describe('resumable Release uploads', () => {
  it('uploads in chunks and completes into the same Release body as a single upload', async () => {
    const before = Date.now();
    const upload = await startUpload();
    expect(upload).toEqual({
      uploadId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      offset: 0,
      size: archive.byteLength,
      chunkSize: RELEASE_UPLOAD_CHUNK_SIZE,
      expiresAt: expect.any(String),
    });
    expect(Date.parse(upload.expiresAt)).toBeGreaterThanOrEqual(
      before + RELEASE_UPLOAD_TTL_MS,
    );

    const last = await sendAll(upload.uploadId);
    expect(await last.json()).toEqual({
      data: {
        uploadId: upload.uploadId,
        offset: archive.byteLength,
        size: archive.byteLength,
        expiresAt: expect.any(String),
      },
    });
    const current = await status(upload.uploadId);
    expect(current.status).toBe(200);
    expect(await current.json()).toMatchObject({
      data: { uploadId: upload.uploadId, offset: archive.byteLength },
    });

    const completed = await complete(upload.uploadId, {
      headers: { 'idempotency-key': 'ci-run-1' },
    });
    expect(completed.status).toBe(200);
    const release = ((await completed.json()) as { data: object }).data;
    expect(release).toEqual({
      id: expect.any(String),
      releaseId: expect.any(String),
      version: '1.0.0',
      checksum,
      size: archive.byteLength,
      createdAt: expect.any(String),
      hasConfigTemplate: false,
      reused: false,
    });
    const releaseId = (release as { releaseId: string }).releaseId;
    expect(await hub.listReleases('crm')).toHaveLength(1);
    // The staged bytes are gone; only the tombstone record remains.
    expect(await readdir(sessionDir(upload.uploadId))).toEqual(['meta.json']);

    // A retried completion answers with the same Release.
    const retried = await complete(upload.uploadId);
    expect(retried.status).toBe(200);
    expect(await retried.json()).toEqual({ data: release });
    expect(await hub.listReleases('crm')).toHaveLength(1);
    // A late chunk for a completed upload is refused.
    const late = await put(upload.uploadId, 0, archive.subarray(0, 1));
    expect(late.status).toBe(409);
    expect(await errorOf(late)).toMatchObject({
      code: 'UPLOAD_COMPLETED',
      offset: archive.byteLength,
    });

    // The single upload answers with exactly the same members.
    const single = await api.request('/hub/apps/crm/releases', {
      method: 'POST',
      headers: { ...auth(), 'content-type': 'application/gzip' },
      body: archive,
    });
    expect(single.status).toBe(200);
    expect(await single.json()).toEqual({
      data: { ...release, reused: true },
    });
    // The idempotency key sent with the completion was recorded.
    expect(
      await db
        .query()
        .selectFrom('hubReleaseRequests')
        .select(['requestKey', 'releaseId'])
        .execute(),
    ).toEqual([{ requestKey: 'ci-run-1', releaseId }]);
  });

  it('answers with the existing Release for a known checksum without staging anything', async () => {
    const single = await api.request('/hub/apps/crm/releases', {
      method: 'POST',
      headers: { ...auth(), 'content-type': 'application/gzip' },
      body: archive,
    });
    const stored = ((await single.json()) as { data: object }).data;
    const response = await start({
      size: archive.byteLength,
      sha256: checksum,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { release: { ...stored, reused: true } },
    });
    expect(await sessionDirs()).toEqual([]);
    // The checksum is scoped to its App: another App stages a new upload.
    expect(
      (
        await start(
          { size: archive.byteLength, sha256: checksum },
          { app: 'erp' },
        )
      ).status,
    ).toBe(201);
  });

  it('resumes an unfinished session when the same archive is declared again', async () => {
    const upload = await startUpload();
    await put(upload.uploadId, 0, archive.subarray(0, 10));
    const again = await start({ size: archive.byteLength, sha256: checksum });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({
      data: {
        upload: {
          uploadId: upload.uploadId,
          offset: 10,
          size: archive.byteLength,
          chunkSize: RELEASE_UPLOAD_CHUNK_SIZE,
          expiresAt: expect.any(String),
        },
      },
    });
    expect(await sessionDirs()).toEqual([upload.uploadId]);
  });

  it('reports the current offset on a mismatch so the client can resume from it', async () => {
    const upload = await startUpload();
    expect(
      (await put(upload.uploadId, 0, archive.subarray(0, 20))).status,
    ).toBe(200);
    // The client lost the answer and resends the same chunk.
    const repeated = await put(upload.uploadId, 0, archive.subarray(0, 20));
    expect(repeated.status).toBe(409);
    const error = await errorOf(repeated);
    expect(error).toEqual({
      code: 'UPLOAD_OFFSET_MISMATCH',
      message: expect.any(String),
      offset: 20,
    });
    const offset = error.offset as number;
    expect(
      (await put(upload.uploadId, offset, archive.subarray(offset))).status,
    ).toBe(200);
    expect((await complete(upload.uploadId)).status).toBe(200);
  });

  it('keeps the offset at the bytes on disk when a chunk arrives short', async () => {
    const upload = await startUpload();
    await put(upload.uploadId, 0, archive.subarray(0, 10));
    const short = await put(upload.uploadId, 10, archive.subarray(10, 20), {
      headers: { 'content-length': '30' },
    });
    expect(short.status).toBe(400);
    expect(await errorOf(short)).toMatchObject({ code: 'INCOMPLETE_CHUNK' });
    expect(await status(upload.uploadId).then((r) => r.json())).toMatchObject({
      data: { offset: 10 },
    });
    expect(
      (await readFile(path.join(sessionDir(upload.uploadId), 'data'))).length,
    ).toBe(10);
    await put(upload.uploadId, 10, archive.subarray(10));
    expect((await complete(upload.uploadId)).status).toBe(200);
  });

  it('refuses to complete an upload that is missing bytes', async () => {
    const upload = await startUpload();
    await put(upload.uploadId, 0, archive.subarray(0, 5));
    const response = await complete(upload.uploadId);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toEqual({
      code: 'UPLOAD_INCOMPLETE',
      message: expect.any(String),
      offset: 5,
    });
  });

  it('discards the session when the bytes do not match the declared checksum', async () => {
    const upload = await startUpload(archive, 'f'.repeat(64));
    await sendAll(upload.uploadId);
    const response = await complete(upload.uploadId);
    expect(response.status).toBe(422);
    expect(await errorOf(response)).toMatchObject({
      code: 'CHECKSUM_MISMATCH',
    });
    expect((await status(upload.uploadId)).status).toBe(404);
    expect(await hub.listReleases('crm')).toHaveLength(0);
  });

  it('discards the session when the archive is not a Release', async () => {
    const bytes = new TextEncoder().encode('not a gzip archive');
    const upload = await startUpload(bytes);
    await put(upload.uploadId, 0, bytes);
    const response = await complete(upload.uploadId);
    expect(response.status).toBe(422);
    expect(await errorOf(response)).toMatchObject({ code: 'INVALID_ARTIFACT' });
    expect(await sessionDirs()).toEqual([]);
  });

  it('forgets expired sessions on access and sweeps them when a session is created', async () => {
    const expired = await startUpload();
    const other = await startUpload(archive.subarray(0, 50));
    for (const uploadId of [expired.uploadId, other.uploadId]) {
      const file = path.join(sessionDir(uploadId), 'meta.json');
      const meta = JSON.parse(await readFile(file, 'utf8')) as object;
      await writeFile(
        file,
        JSON.stringify({
          ...meta,
          updatedAt: new Date(
            Date.now() - RELEASE_UPLOAD_TTL_MS - 1000,
          ).toISOString(),
        }),
      );
    }
    for (const response of [
      await status(expired.uploadId),
      await put(expired.uploadId, 0, archive.subarray(0, 1)),
      await complete(expired.uploadId),
    ]) {
      expect(response.status).toBe(404);
      expect(await errorOf(response)).toMatchObject({
        code: 'UPLOAD_NOT_FOUND',
      });
    }
    expect(await sessionDirs()).toEqual([other.uploadId]);
    // Declaring the same archive again starts over instead of resuming the expired session.
    const fresh = await startUpload();
    expect(fresh.uploadId).not.toBe(expired.uploadId);
    expect(await sessionDirs()).toEqual([fresh.uploadId]);
  });

  it('sweeps the expired sessions of other Apps once per interval', async () => {
    const before = Date.now();
    const other = await start(
      { size: archive.byteLength, sha256: checksum },
      { app: 'erp' },
    );
    expect(other.status).toBe(201);
    const { uploadId } = (
      (await other.json()) as { data: { upload: UploadBody } }
    ).data.upload;
    const file = path.join(sessionDir(uploadId, 'erp'), 'meta.json');
    const meta = JSON.parse(await readFile(file, 'utf8')) as object;
    await writeFile(
      file,
      JSON.stringify({
        ...meta,
        updatedAt: new Date(
          before - RELEASE_UPLOAD_TTL_MS - 1000,
        ).toISOString(),
      }),
    );
    // Starting an upload for another App leaves it alone until the sweep interval has passed.
    await startUpload();
    expect(await sessionDirs('erp')).toEqual([uploadId]);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(before + RELEASE_UPLOAD_SWEEP_INTERVAL_MS + 1000);
      await startUpload(archive.subarray(0, 50));
    } finally {
      vi.useRealTimers();
    }
    expect(await sessionDirs('erp')).toEqual([]);
    expect(await sessionDirs()).toHaveLength(2);
  });

  it('keeps each session to its own App', async () => {
    const upload = await startUpload();
    for (const response of [
      await status(upload.uploadId, { app: 'erp' }),
      await put(upload.uploadId, 0, archive.subarray(0, 1), { app: 'erp' }),
      await complete(upload.uploadId, { app: 'erp' }),
    ]) {
      expect(response.status).toBe(404);
      expect(await errorOf(response)).toMatchObject({
        code: 'UPLOAD_NOT_FOUND',
      });
    }
    expect(await status(upload.uploadId).then((r) => r.json())).toMatchObject({
      data: { offset: 0 },
    });
    for (const uploadId of ['not-a-uuid', '..%2F..%2Fetc']) {
      expect((await status(uploadId)).status).toBe(404);
    }
  });

  it('requires the upload-release scope', async () => {
    const upload = await startUpload();
    for (const response of [
      await start(
        { size: archive.byteLength, sha256: checksum },
        { key: deployer },
      ),
      await status(upload.uploadId, { key: deployer }),
      await put(upload.uploadId, 0, archive.subarray(0, 1), { key: deployer }),
      await api.request(
        `/hub/apps/crm/releases/uploads/${upload.uploadId}/complete`,
        { method: 'POST', headers: auth(deployer) },
      ),
    ])
      expect(response.status).toBe(403);
  });

  it('validates declarations and chunks', async () => {
    for (const body of [
      { size: 0, sha256: checksum },
      { size: MAX_RESUMABLE_ARTIFACT_SIZE + 1, sha256: checksum },
      { size: 1.5, sha256: checksum },
      { size: 10, sha256: checksum.toUpperCase() },
      { size: 10 },
      'not json',
    ]) {
      const response = await start(body);
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toMatchObject({ code: 'INVALID_UPLOAD' });
    }
    const upload = await startUpload();
    const oversized = await put(upload.uploadId, 0, archive.subarray(0, 1), {
      headers: { 'content-length': String(RELEASE_UPLOAD_CHUNK_SIZE + 1) },
    });
    expect(oversized.status).toBe(413);
    expect(await errorOf(oversized)).toMatchObject({ code: 'CHUNK_TOO_LARGE' });
    const past = await put(
      upload.uploadId,
      0,
      Buffer.concat([archive, archive]),
    );
    expect(past.status).toBe(400);
    expect(await errorOf(past)).toMatchObject({ code: 'UPLOAD_TOO_LARGE' });
    for (const headers of [
      { 'content-length': '0' },
      { 'upload-offset': '-1' },
      { 'upload-offset': 'abc' },
    ]) {
      const response = await put(upload.uploadId, 0, archive.subarray(0, 1), {
        headers,
      });
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toMatchObject({ code: 'INVALID_CHUNK' });
    }
    const wrongType = await put(upload.uploadId, 0, archive.subarray(0, 1), {
      headers: { 'content-type': 'application/gzip' },
    });
    expect(wrongType.status).toBe(400);
    expect(await errorOf(wrongType)).toMatchObject({
      code: 'INVALID_CONTENT_TYPE',
    });
    const badKey = await complete(upload.uploadId, {
      headers: { 'idempotency-key': 'has spaces' },
    });
    expect(badKey.status).toBe(400);
    expect(await errorOf(badKey)).toMatchObject({
      code: 'INVALID_IDEMPOTENCY_KEY',
    });
    expect(await status(upload.uploadId).then((r) => r.json())).toMatchObject({
      data: { offset: 0 },
    });
  });

  it('removes the sessions of a removed App', async () => {
    const upload = await startUpload();
    await hub.remove('crm');
    expect(await sessionDirs()).toEqual([]);
    expect(upload.uploadId).toBeTruthy();
  });
});
