import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { resolveAppRuntime } from '@nocobase/app-server/runtime';
import appRuntime from '../../server/runtime.js';
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function configured(password: string) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'equipment-sample-config-'),
  );
  roots.push(root);
  const configPath = path.join(root, 'config.yml');
  await writeFile(configPath, '{}');
  return resolveAppRuntime(appRuntime, {
    id: 'equipment-pm697-latest',
    mode: 'embedded',
    rootDir: path.resolve(import.meta.dirname, '../..'),
    dataDir: path.join(root, 'storage'),
    basePath: '/equipment-pm697-latest',
    configPath,
    env: {
      EQUIPMENT_SAMPLE_PASSWORD: password,
      APP_SAMPLE_DATA: 'true',
      SECRETS_KEYS: '1:' + randomBytes(32).toString('hex'),
    },
    registerDisposer() {},
  });
}
it('maps an explicit Host environment into the private equipment section', async () => {
  const password = randomBytes(24).toString('base64url'),
    runtime = await configured(password);
  expect(runtime.config.get('equipment.samplePassword')).toBe(password);
  expect(runtime.config.get('app.sampleData')).toBe(true);
  expect(
    runtime.config.environmentVariableMappings().EQUIPMENT_SAMPLE_PASSWORD,
  ).toMatchObject({
    path: 'equipment.samplePassword',
    secret: true,
    generate: 'password',
    firstStartOnly: true,
  });
});
it('rejects a short supplied value during config validation', async () => {
  const runtime = await configured('short-synthetic');
  const issues = await runtime.config.validate();
  expect(
    issues.some((issue) => issue.path === 'equipment.samplePassword'),
  ).toBe(true);
});
