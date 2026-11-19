import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  AppConfig,
  createAppPaths,
  envString,
} from '@nocobase/app-server/config';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { inspectConfiguration } from '../../server/snapshot.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'inspector-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const CONFIG = `# Local configuration
app:
  publicOrigin: https://admin:private-key@example.com/foo?token=private-key
logging:
  level: info
users:
  initialAdmin:
    username: nocobase
    password: private-key # replace before going live
secrets:
  keys:
    - version: 1
      key: private-key
notification:
  channels:
    ops:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/private-key
custom:
  token: private-key
  note: visible
# password: private-key
# A leftover https://user:private-key@db.example.com URL
`;

const EXAMPLE = `# The public origin.
# app:
#   publicOrigin: https://apps.example.com

logging:
  level: info

users:
  initialAdmin:
    username: nocobase
    password: admin123
`;

async function load(environment: Record<string, string>) {
  await writeFile(path.join(dir, 'config.yml'), CONFIG);
  await writeFile(path.join(dir, 'config.example.yml'), EXAMPLE);
  const config = new AppConfig().loadFile(path.join(dir, 'config.yml'));
  await config.loadAll();
  config.mergeDefaults({ server: { port: 13000 } });
  config.defineSections(
    new Map([
      [
        'app',
        {
          validators: [],
          public: [],
          env: { APP_PUBLIC_ORIGIN: envString('publicOrigin') },
        },
      ],
      [
        'logging',
        { validators: [], public: [], env: { LOG_LEVEL: envString('level') } },
      ],
      [
        'users',
        {
          validators: [],
          public: [],
          env: {
            INITIAL_ADMIN_PASSWORD: {
              ...envString('initialAdmin.password'),
              secret: true,
              firstStartOnly: true,
            },
          },
        },
      ],
    ]),
  );
  await config.loadSectionEnvironment(environment);
  return inspectConfiguration({
    config,
    paths: createAppPaths({ rootDir: dir }),
  });
}

it('attributes each running value to its source', async () => {
  const snapshot = await load({ LOG_LEVEL: 'debug' });
  const setting = (at: string) =>
    snapshot.settings.find((item) => item.path === at);
  expect(setting('logging.level')).toMatchObject({
    value: 'debug',
    source: 'environment',
    variable: 'LOG_LEVEL',
    fileValue: 'info',
    customized: true,
  });
  expect(setting('server.port')).toMatchObject({
    value: '13000',
    source: 'default',
    customized: false,
  });
  expect(setting('users.initialAdmin.username')).toMatchObject({
    source: 'file',
    customized: false,
  });
  expect(setting('custom.note')).toMatchObject({
    value: 'visible',
    source: 'file',
  });
  expect(
    snapshot.variables.find((item) => item.name === 'LOG_LEVEL'),
  ).toMatchObject({
    set: true,
    value: 'debug',
  });
  expect(
    snapshot.variables.find((item) => item.name === 'INITIAL_ADMIN_PASSWORD'),
  ).toMatchObject({
    set: false,
    value: null,
    secret: true,
    firstStartOnly: true,
  });
  expect(snapshot.file).toMatchObject({ path: 'config.yml', exists: true });
  expect(snapshot.sections.map((section) => section.key)).toEqual(
    expect.arrayContaining(['app', 'logging', 'custom', 'server']),
  );
  expect(
    snapshot.sections.find((section) => section.key === 'app'),
  ).toMatchObject({
    comment: 'The public origin.',
    inExample: true,
  });
});

it('never returns a credential, in values, the file or its comments', async () => {
  const snapshot = await load({
    INITIAL_ADMIN_PASSWORD: 'private-key',
    APP_PUBLIC_ORIGIN: 'https://admin:private-key@example.com',
  });
  expect(JSON.stringify(snapshot)).not.toContain('private-key');
  expect(snapshot.file.text).toContain('# Local configuration');
  expect(snapshot.file.text).toContain('password: ••••••');
  expect(snapshot.file.text).toContain('webhookUrl: ••••••');
  expect(snapshot.file.text).toContain('note: visible');
  expect(snapshot.example).toContain('password: ••••••');
  const password = snapshot.settings.find(
    (item) => item.path === 'users.initialAdmin.password',
  );
  expect(password).toMatchObject({
    value: '[redacted]',
    fileValue: '[redacted]',
    secret: true,
    firstStartOnly: true,
  });
});

it('keeps the previous inspection when a reload is refused', async () => {
  await writeFile(path.join(dir, 'config.yml'), 'logging:\n  level: info\n');
  const config = new AppConfig().loadFile(path.join(dir, 'config.yml'));
  await config.loadAll();
  config.defineSections(
    new Map([
      [
        'logging',
        {
          validators: [
            (value: { level?: string }, context) => {
              if (value.level === 'bad') context.error('level', 'bad level');
            },
          ] as never[],
          public: [],
        },
      ],
    ]),
  );
  const before = config.inspect();
  await writeFile(path.join(dir, 'config.yml'), 'logging:\n  level: bad\n');
  await expect(config.reload()).rejects.toThrow();
  expect(config.inspect().files[0].text).toBe(before.files[0].text);
  await writeFile(path.join(dir, 'config.yml'), 'logging:\n  level: warn\n');
  await config.reload();
  expect(config.inspect()).toMatchObject({ reloads: 1 });
  expect(config.inspect().files[0].text).toContain('warn');
});
