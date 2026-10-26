import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const root = process.argv[2];
if (!root)
  throw new Error(
    'Pass an absolute directory containing a freshly extracted deployment archive.',
  );
const out = process.argv[3] || root;
const origin = 'http://127.0.0.1:17077',
  base = origin + '/equipment-pm707-local';
const password = randomBytes(24).toString('base64url');
await fs.writeFile(root + '/config.yml', '{}', { flag: 'wx' });
const env = {
  ...process.env,
  APP_CONFIG_FILE: root + '/config.yml',
  APP_STORAGE_DIR: root + '/storage',
  APP_SERVER_HOST: '127.0.0.1',
  APP_SERVER_PORT: '17077',
  APP_PUBLIC_ORIGIN: origin,
  APP_BASE_PATH: '/equipment-pm707-local',
  APP_SAMPLE_DATA: 'true',
  EQUIPMENT_SAMPLE_PASSWORD: password,
  INITIAL_ADMIN_USERNAME: 'previewadmin',
  INITIAL_ADMIN_PASSWORD: password,
  SECRETS_KEYS: '1:' + randomBytes(32).toString('hex'),
};
let child, browser;
const log = createWriteStream(out + '/runtime.log');
async function start() {
  child = spawn(process.execPath, [root + '/dist/server/standalone.js'], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  for (let i = 0; i < 240; i++) {
    if (child.exitCode !== null)
      throw new Error('Runtime exited ' + child.exitCode);
    try {
      if ((await fetch(base + '/api/healthz')).ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Runtime readiness timeout');
}
async function stop() {
  if (child?.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((r) => child.once('exit', r));
  }
}
try {
  await start();
  console.log('Final archive started on isolated new storage.');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
  });
  const loginPage = await context.newPage();
  await loginPage.goto(base + '/login');
  await loginPage
    .locator('input[autocomplete="username"]')
    .fill('previewadmin');
  await loginPage
    .locator('input[autocomplete="current-password"]')
    .fill(password);
  await loginPage.locator('button[type="submit"]').click();
  await loginPage.waitForURL((url) => !url.pathname.endsWith('/login'));
  await loginPage.close();
  const docs = await context.request.get(base + '/api/swagger');
  assert.equal(docs.status(), 200);
  const assets = await (
    await context.request.get(base + '/api/equipment/assets?pageSize=100')
  ).json();
  assert.equal(assets.meta.total, 100);
  assert.equal(new Set(assets.data.map((a) => a.status)).size, 5);
  const item = assets.data.find((a) => a.status === 'idle');
  const changed = await context.request.patch(
    base + '/api/equipment/assets/' + item.id,
    {
      headers: { origin },
      data: {
        name: 'Persistence verification equipment',
        expectVersion: item.lifecycleVersion,
      },
    },
  );
  assert.equal(changed.status(), 200);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/equipment');
  await page.getByText('Persistence verification equipment').first().waitFor();
  await page.screenshot({
    path: out + '/equipment-desktop.png',
    fullPage: true,
  });
  await page.reload();
  await page.getByText('Persistence verification equipment').first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: out + '/equipment-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of [
    '',
    '/operations',
    '/maintenance',
    '/stocktakes',
    '/settings/roles',
  ]) {
    await page.goto(base + route + '/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path:
        out + '/equipment-' + (route.split('/').pop() || 'dashboard') + '.png',
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  for (const username of [
    'equipment.manager',
    'equipment.member',
    'equipment.viewer',
  ]) {
    const c = await browser.newContext();
    const signed = await c.request.post(base + '/api/auth/sign-in/username', {
      headers: { origin },
      data: { username, password },
    });
    assert.equal(signed.status(), 200);
    const list = await c.request.get(
      base + '/api/equipment/assets?pageSize=100',
    );
    assert.equal(list.status(), 200);
    const rows = (await list.json()).data;
    if (username === 'equipment.manager') assert.equal(rows.length, 100);
    else {
      assert(rows.length < 100);
      assert(rows.every((r) => !('purchaseCost' in r)));
      assert.equal(
        (await c.request.get(base + '/api/equipment/export')).status(),
        403,
      );
    }
    await c.close();
  }
  await page.close();
  await stop();
  await start();
  const after = await context.request.get(
    base + '/api/equipment/assets/' + item.id,
  );
  assert.equal(after.status(), 200);
  assert.equal(
    (await after.json()).data.record.name,
    'Persistence verification equipment',
  );
  const count = await (
    await context.request.get(base + '/api/equipment/assets')
  ).json();
  assert.equal(count.meta.total, 100);
  await fs.writeFile(
    out + '/runtime-result.json',
    JSON.stringify(
      {
        archive: true,
        syntheticAssets: 100,
        states: 5,
        nativeLogin: true,
        threeRoles: true,
        refresh: true,
        restartPersistence: true,
        sampleNotDuplicated: true,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'Final archive, three roles, browser refresh and restart persistence passed.',
  );
} finally {
  await browser?.close();
  await stop();
  log.end();
}
