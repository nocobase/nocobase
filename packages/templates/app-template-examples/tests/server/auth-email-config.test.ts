// @vitest-environment node

import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import {
  AppConfig,
  defaultAppConfigs,
  buildVariablesManifest,
} from '@nocobase/app-server/config';
import auth from '../../server/config/auth.js';

it('inherits private authentication sender mappings without changing other mail consumers', async () => {
  const defaults = defaultAppConfigs({ auth });
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults(defaults({} as never));
  config.defineSections(defaults.sections!);
  await config.loadSectionEnvironment({
    AUTH_EMAIL_PROVIDER: 'smtp',
    AUTH_EMAIL_HOST: 'smtp.example.test',
    AUTH_EMAIL_PORT: '587',
    AUTH_EMAIL_SECURE: 'false',
    AUTH_EMAIL_FROM: 'sender@example.test',
    AUTH_EMAIL_PASSWORD: 'synthetic-password',
    AUTH_EMAIL_USER: 'synthetic',
    MAIL_HOST: 'unrelated.example.test',
  });
  expect(await config.validate()).toEqual([]);
  expect(config.get('auth.email.host')).toBe('smtp.example.test');
  expect(config.get('auth.email.port')).toBe(587);
  expect(config.get('auth.email.secure')).toBe(false);
  expect(JSON.stringify(config.publicValues())).not.toContain(
    'synthetic-password',
  );
  expect(config.get('auth.passwordReset.enabled')).toBeUndefined();
  const variables = buildVariablesManifest({
    app: { name: 'synthetic' },
    variables: config.environmentVariableMappings(),
    defaults: config.layers().defaults,
  }).variables;
  expect(
    variables.filter((variable) => variable.name.startsWith('AUTH_EMAIL_')),
  ).toHaveLength(9);
  expect(
    variables
      .filter((variable) => variable.name.startsWith('AUTH_EMAIL_'))
      .every((variable) => variable.required === false),
  ).toBe(true);
});

it('ships separate, valid SMTP and Resend authentication examples', async () => {
  const example = await readFile(
    new URL('../../config.example.yml', import.meta.url),
    'utf8',
  );
  const blocks = [...example.matchAll(/^ {2}# email:\n(?: {2}# {3}.*\n)+/gm)];
  expect(blocks).toHaveLength(2);
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'auth-email-example-'),
  );
  try {
    for (const block of blocks) {
      const text = 'auth:\n' + block[0].replace(/^ {2}# /gm, '  ');
      const file = path.join(directory, 'config.yml');
      await writeFile(file, text);
      const config = new AppConfig().loadFile(file);
      await config.loadAll();
      const defaults = defaultAppConfigs({ auth });
      config.mergeDefaults(defaults({} as never));
      config.defineSections(defaults.sections!);
      expect(await config.validate()).toEqual([]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  expect(example).not.toContain('emailChannel:');
});
