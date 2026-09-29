import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { clientArtifactRoutes } from '../server/routes/index.js';
import { afterEach, expect, it } from 'vitest';
import {
  buildWorkflowArtifact,
  writeWorkflowArtifact,
} from '../build/artifact-builder.js';
import { LocalWorkflowArtifactStore } from '../server/loader/artifact-store.js';
import { publishWorkflowClientArtifact } from '../server/loader/client-publisher.js';

const roots: string[] = [];
afterEach(async () =>
  Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  ),
);

it('restores missing and damaged published client files from the persistent Artifact', async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'workflow-client-publish-'),
  );
  roots.push(root);
  const manifest = {
    formatVersion: 1,
    hostAbi: 1,
    entries: { 'workflow.inputForm': { js: 'client/form.js', css: [] } },
    files: ['client/form.js'],
  };
  const artifact = buildWorkflowArtifact({
    key: 'sample',
    flatIr: {
      title: 'Sample',
      inputSchema: { type: 'object' },
      start: null,
      nodes: [],
      client: { inputForm: './client/form.ts' },
    },
    resourceFiles: new Map([
      ['client/manifest.json', JSON.stringify(manifest)],
      ['client/form.js', 'export default () => "old";'],
    ]),
  });
  const dist = await writeWorkflowArtifact(artifact, path.join(root, 'dist'));
  const store = new LocalWorkflowArtifactStore({
    storeRoot: path.join(root, 'store'),
  });
  await store.commit('sample', artifact.digest, dist);
  const clientDir = path.join(root, 'client');
  const published = path.join(
    clientDir,
    'assets/workflow-artifacts',
    artifact.digest,
    'client/form.js',
  );
  await publishWorkflowClientArtifact(
    store,
    clientDir,
    'sample',
    artifact.digest,
  );
  await expect(fs.readFile(published, 'utf8')).resolves.toContain('old');
  await fs.writeFile(published, 'damaged');
  await publishWorkflowClientArtifact(
    store,
    clientDir,
    'sample',
    artifact.digest,
  );
  await expect(fs.readFile(published, 'utf8')).resolves.toContain('old');
  await fs.rm(path.join(clientDir, 'assets'), { recursive: true });
  await publishWorkflowClientArtifact(
    store,
    clientDir,
    'sample',
    artifact.digest,
  );
  await expect(fs.readFile(published, 'utf8')).resolves.toContain('old');
});

it('serves immutable artifact assets before a development SPA fallback under an app base', async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'workflow-assets-route-'),
  );
  roots.push(root);
  const hash = 'a'.repeat(64);
  const directory = path.join(
    root,
    'assets/workflow-artifacts',
    hash,
    'client',
  );
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, 'form.js'),
    'export default () => "snapshot";',
  );
  const router = await clientArtifactRoutes.createRouter({
    paths: { clientDir: root },
  } as Parameters<typeof clientArtifactRoutes.createRouter>[0]);
  const app = new Hono().route('/main', router);
  app.get('*', (c) => c.html('<html>Vite</html>'));
  const url = `/main/assets/workflow-artifacts/${hash}/client/form.js`;
  const response = await app.request(url);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('javascript');
  expect(response.headers.get('cache-control')).toContain('immutable');
  expect(await response.text()).toContain('snapshot');
  expect((await app.request(url, { method: 'HEAD' })).status).toBe(200);
  expect((await app.request(url, { method: 'POST' })).status).toBe(405);
  expect((await app.request(url.replace('form.js', 'missing.js'))).status).toBe(
    404,
  );
  expect((await app.request(url.replace(hash, 'invalid'))).status).toBe(404);
});
