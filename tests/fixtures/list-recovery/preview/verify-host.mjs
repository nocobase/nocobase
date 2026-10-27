import { createAppHost } from '../../../../packages/app/app-host/src/index.ts';
import { DriveArtifactResolver } from '../../../../packages/app/app-host/src/artifact-resolver.ts';
import { DeploymentCatalog } from '../../../../packages/app/app-host/src/deployment/catalog.ts';
import { inspectArtifact } from '../../../../packages/plugins/app-plugin-releases/server/services/artifact.ts';
import { createRequire } from 'node:module';
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { deploymentTree } from './tree.mjs';
import { sampleIds } from './routing.mjs';
const source = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const require = createRequire(
  path.join(source, 'packages/templates/app-template-default/package.json'),
);
const { chromium, expect } = require('@playwright/test');
const [archive, work] = process.argv
  .slice(2)
  .map((value) => path.resolve(value));
const origin = 'http://127.0.0.1:13930',
  prefix = '/nocobase-v3-pr-11186';
await mkdir(work, { recursive: true });
const metadata = await inspectArtifact(archive);
const checksum = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex');
const catalog = new DeploymentCatalog({
  deploymentsDir: path.join(work, 'revisions'),
  volumesDir: path.join(work, 'volumes'),
});
const resolver = new DriveArtifactResolver({}, catalog, {
  localArtifactDir: path.dirname(archive),
});
const resolved = await resolver.resolve({
  key: path.basename(archive),
  appId: 'acceptance',
  version: metadata.version,
  checksum,
});
const rootDir = path.join(work, 'revisions', 'acceptance', checksum);
const tree = await deploymentTree(rootDir);
assert.deepEqual(
  tree,
  JSON.parse(
    await readFile(
      path.join(path.dirname(archive), 'expected-tree.json'),
      'utf8',
    ),
  ),
);
const password = randomBytes(24).toString('hex');
const host = createAppHost({
  mode: 'managed',
  port: 13930,
  host: '127.0.0.1',
  appRevisionsDir: path.join(work, 'host-revisions'),
  appVolumesDir: path.join(work, 'host-volumes'),
  artifact: {
    driver: 'fs',
    location: path.join(work, 'artifacts'),
    visibility: 'private',
  },
  logging: { level: 'silent' },
  evictionIntervalMs: 0,
});
let browser;
const started = Date.now();
const results = [];
try {
  await host.start();
  await host.registry.register('acceptance', {
    rootDir,
    dataDir: path.join(work, 'data'),
    basePath: prefix,
    entrypoint: 'dist/server/embedded.js',
    client: { rootDir: path.join(rootDir, 'dist/client') },
    env: {
      NODE_ENV: 'production',
      NOCOBASE_STRICT_STARTUP: 'true',
      APP_PUBLIC_ORIGIN: origin,
      SECRETS_KEYS: `1:${randomBytes(32).toString('hex')}`,
      INITIAL_ADMIN_USERNAME: 'acceptance',
      INITIAL_ADMIN_EMAIL: 'acceptance@example.test',
      INITIAL_ADMIN_PASSWORD: password,
    },
  });
  await host.registry.ensureActive('acceptance');
  const startupMs = Date.now() - started;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1360, height: 950 },
    }),
    page = await context.newPage();
  for (const [index, id] of sampleIds.entries()) {
    const count = [121, 120, 1, 121][index];
    const base = `${origin}${prefix}/acceptance/${id}/`;
    expect((await context.request.get(`${base}api/loans`)).status()).toBe(401);
    await page.goto(`${base}login`);
    await page.getByLabel('Username or email').fill('acceptance');
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    await page.goto(`${base}loans?status=open&page=1&pageSize=10`);
    await page
      .getByLabel('Sample records', { exact: true })
      .selectOption(String(count));
    await page
      .getByRole('button', { name: 'Reset this sample', exact: true })
      .click();
    await expect(page.getByTestId('total')).toHaveText(
      `Matching total: ${count}`,
    );
    const pong = await page.evaluate(
      async (base) =>
        new Promise((resolve, reject) => {
          const socket = new WebSocket(base.replace('http:', 'ws:') + 'ws');
          const timer = setTimeout(() => {
            socket.close();
            reject(Error('WebSocket response deadline'));
          }, 10000);
          socket.onerror = () => {
            clearTimeout(timer);
            reject(Error('WebSocket handshake failed'));
          };
          socket.onopen = () =>
            socket.send(
              JSON.stringify({ type: 'ping', id: 'isolation-probe' }),
            );
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              clearTimeout(timer);
              socket.close();
              resolve(data.id);
            }
          };
        }),
      base,
    );
    expect(pong).toBe('isolation-probe');
    await page.screenshot({ path: path.join(work, `${id}-reset.png`) });
    results.push({
      id,
      count,
      resetUI: 'passed',
      websocket: 'ping/pong passed',
    });
  }
  // Logout one native session must not invalidate any other sample's session.
  const loggedOut = await context.request.post(
    `${origin}${prefix}/acceptance/default-new/api/auth/sign-out`,
    { data: {}, headers: { origin } },
  );
  expect(loggedOut.ok()).toBeTruthy();
  for (const id of sampleIds)
    expect(
      (
        await context.request.get(
          `${origin}${prefix}/acceptance/${id}/api/loans?status=open`,
        )
      ).status(),
    ).toBe(id === 'default-new' ? 401 : 200);
  for (const id of sampleIds.slice(1))
    expect(
      (
        await (
          await context.request.get(
            `${origin}${prefix}/acceptance/${id}/api/loans?status=open`,
          )
        ).json()
      ).meta.total,
    ).toBe(results.find((result) => result.id === id).count);
  for (const id of sampleIds) {
    for (const script of ['browser', 'breadcrumbs'])
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            path.join(source, `tests/fixtures/list-recovery/${script}.mjs`),
            id.endsWith('upgraded') ? 'old' : 'new',
          ],
          {
            cwd: source,
            env: {
              ...process.env,
              APP_ENTRY: `${origin}${prefix}/acceptance/${id}/`,
              E2E_USERNAME: 'acceptance',
              E2E_PASSWORD: password,
              VERIFICATION_WORK: path.join(work, 'matrix', id),
              NOCOBASE_SOURCE: source,
              SAMPLE_ID: id,
              RECHECK_ONLY: '1',
            },
            stdio: ['ignore', 'inherit', 'inherit'],
          },
        );
        child.on('error', reject);
        child.on('exit', (code) =>
          code === 0
            ? resolve()
            : reject(Error(`${id}/${script} failed (${code})`)),
        );
      });
  }
  await writeFile(
    path.join(work, 'result.json'),
    JSON.stringify(
      {
        checksum,
        verifiedFileCount: Object.keys(tree).length,
        archiveBytes: (await stat(archive)).size,
        startupMs,
        rssBytes: process.memoryUsage().rss,
        logoutIsolation: 'passed',
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    'Extracted preview: reset UI, WebSocket, logout isolation and 84 browser cases passed.',
  );
} finally {
  await browser?.close();
  await host.close('verification complete');
  await resolved.rollback();
}
