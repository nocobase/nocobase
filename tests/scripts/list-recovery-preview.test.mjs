import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  preserveSampleAssets,
  resolveSampleRequest,
  sampleIds,
  validateSampleIds,
} from '../fixtures/list-recovery/preview/routing.mjs';
import { addBasePathToHtmlResponse } from '../../packages/app/app-host/src/redirects.ts';
import { packSamples } from '../fixtures/list-recovery/preview/pack.mjs';

test('each sample receives its own app-local path and the unchanged mutation', async () => {
  for (const id of sampleIds) {
    const result = resolveSampleRequest(
      new Request(`https://preview.test/acceptance/${id}/api/loans?sort=desc`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"count":11}',
      }),
    );
    assert.equal(result.id, id);
    assert.equal(
      result.request.url,
      'https://preview.test/api/loans?sort=desc',
    );
    assert.equal(result.request.method, 'POST');
    assert.equal(await result.request.text(), '{"count":11}');
  }
  assert.equal(
    resolveSampleRequest(
      new Request('https://preview.test/acceptance/default-newer/api'),
    ),
    null,
  );
  assert.equal(
    resolveSampleRequest(new Request('https://preview.test/api')),
    null,
  );
});

test('sample assets survive the actual outer host rewrite without changing navigation', async () => {
  const base = '/nocobase-v3-pr-11186/acceptance/default-new';
  const html = `<script src="${base}/assets/app.js"></script><a href="${base}/main/loans">Loans</a>`;
  const response = await preserveSampleAssets(
    new Response(html, {
      headers: {
        'content-type': 'text/html',
        'content-length': String(html.length),
      },
    }),
    'https://preview.test',
    base,
  );
  const hosted = await addBasePathToHtmlResponse(
    response,
    '/nocobase-v3-pr-11186',
  );
  assert.equal(
    await hosted.text(),
    `<script src="https://preview.test${base}/assets/app.js"></script><a href="${base}/main/loans">Loans</a>`,
  );
  assert.equal(hosted.headers.has('content-length'), false);
});

test('asset rewriting preserves cookies, status and unrelated attributes', async () => {
  const response = await preserveSampleAssets(
    new Response('<img src="//cdn.test/assets/x"><a href="/main">Home</a>', {
      status: 201,
      headers: {
        'content-type': 'text/html',
        'set-cookie': 'sample=session; HttpOnly',
      },
    }),
    'https://preview.test',
    '/acceptance/default-new',
  );
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('set-cookie'), 'sample=session; HttpOnly');
  assert.equal(
    await response.text(),
    '<img src="//cdn.test/assets/x"><a href="/main">Home</a>',
  );
});

test('embedded samples receive isolated paths and lifecycle disposal', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'list-preview-'));
  const server = path.join(root, 'dist/server');
  await mkdir(server, { recursive: true });
  for (const file of ['routing.mjs', 'embedded.mjs']) {
    await copyFile(
      new URL(`../fixtures/list-recovery/preview/${file}`, import.meta.url),
      path.join(server, file),
    );
  }
  await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await writeFile(
    path.join(server, 'carrier-embedded.js'),
    `export async function createServer() { return { config: {get: key => ({'app.publicOrigin':'https://preview.test','users.initialAdmin':{username:'test',password:'fixture-only'},'secrets.keys':['fixture-only']})[key]},fetch: () => new Response('carrier') }; }`,
  );
  for (const id of sampleIds) {
    const childServer = path.join(root, 'dist/acceptance', id, 'dist/server');
    await mkdir(childServer, { recursive: true });
    await writeFile(
      path.join(childServer, 'embedded.js'),
      `export async function createServer(scope) { scope.registerDisposer('child', () => { globalThis.__previewDisposed.push(scope.id); }); return {websocket: (request, transport) => ({id:scope.id,url:request.url,transport}),fetch: request => Response.json({id:scope.id,basePath:scope.basePath,dataDir:scope.dataDir,rootDir:scope.rootDir,db:scope.env.DB_FILENAME || null,url:request.url})}; }`,
    );
  }
  await writeFile(
    path.join(root, 'dist/acceptance/manifest.json'),
    JSON.stringify({
      samples: Object.fromEntries(
        sampleIds.map((id) => [id, { target: 'candidate' }]),
      ),
    }),
  );
  const callbacks = [];
  globalThis.__previewDisposed = [];
  try {
    const { createServer } = await import(
      pathToFileURL(path.join(server, 'embedded.mjs')).href
    );
    const instance = await createServer({
      id: 'preview',
      basePath: '/preview',
      rootDir: root,
      dataDir: path.join(root, 'data'),
      env: { DB_FILENAME: '/must-not-inherit' },
      registerDisposer(_name, callback) {
        callbacks.push(callback);
      },
    });
    const locations = new Set();
    for (const id of sampleIds) {
      const data = await (
        await instance.fetch(
          new Request(`https://preview.test/acceptance/${id}/api/loans`),
        )
      ).json();
      assert.equal(data.basePath, `/preview/acceptance/${id}`);
      assert.equal(data.db, null);
      assert.equal(data.url, 'https://preview.test/api/loans');
      const transport = { upgrade: 'fixture-transport' };
      const socket = await instance.websocket(
        new Request(`https://preview.test/acceptance/${id}/ws?token=fixture`),
        transport,
      );
      assert.equal(socket.id, `preview-${id}`);
      assert.equal(socket.url, 'https://preview.test/ws?token=fixture');
      assert.equal(socket.transport, transport);
      locations.add(data.dataDir);
    }
    assert.equal(locations.size, sampleIds.length);
    for (const dispose of callbacks) await dispose();
    for (const dispose of callbacks) await dispose();
    assert.equal(globalThis.__previewDisposed.length, sampleIds.length);
  } finally {
    delete globalThis.__previewDisposed;
    await rm(root, { recursive: true, force: true });
  }
});

test('packaging rejects incomplete inputs before modifying the carrier', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'list-preview-pack-'));
  try {
    const manifest = path.join(root, 'manifest.json');
    await writeFile(manifest, JSON.stringify({ samples: {} }));
    await assert.rejects(packSamples(root, manifest), /requires exactly/);
    const source = path.join(root, 'default-new');
    await mkdir(source);
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({ nocobase: { defaultTemplateVersion: 'base' } }),
    );
    await writeFile(
      manifest,
      JSON.stringify({
        samples: {
          'examples-new': {},
          'default-new': {
            sourceDir: 'default-new',
            target: 'target',
            status: 'verified',
          },
        },
      }),
    );
    await assert.rejects(
      packSamples(root, manifest),
      /Incomplete template baseline/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('preview identities exclude historical upgrade samples at every boundary', () => {
  assert.deepEqual(sampleIds, ['default-new', 'examples-new']);
  assert.doesNotThrow(() =>
    validateSampleIds({ 'default-new': {}, 'examples-new': {} }),
  );
  for (const samples of [
    {},
    { 'default-new': {} },
    { 'default-new': {}, 'examples-new': {}, 'default-upgraded': {} },
  ]) {
    assert.throws(() => validateSampleIds(samples), /requires exactly/);
  }
  assert.equal(
    resolveSampleRequest(
      new Request('https://preview.test/acceptance/default-upgraded/api/loans'),
    ),
    null,
  );
});
