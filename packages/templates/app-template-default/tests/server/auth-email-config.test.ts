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
import mailers from '../../server/config/mailers.js';

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

it('ships a valid shared mailer example with private mapped credentials', async () => {
  const example = await readFile(
    new URL('../../config.example.yml', import.meta.url),
    'utf8',
  );
  const block = example.match(/^# mailers:\n(?:#.*\n)+/m)?.[0];
  expect(block).toBeTruthy();
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mailers-example-'));
  try {
    const file = path.join(directory, 'config.yml');
    await writeFile(file, block!.replace(/^# ?/gm, ''));
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    const defaults = defaultAppConfigs({ auth, mailers });
    config.mergeDefaults(defaults({} as never));
    config.defineSections(defaults.sections!);
    await config.loadSectionEnvironment({
      MAILERS_SYSTEM_PASSWORD: 'synthetic-password',
    });
    expect(await config.validate()).toEqual([]);
    expect(config.get('mailers.default')).toBe('system');
    expect(config.get('mailers.system.auth.pass')).toBe('synthetic-password');
    expect(JSON.stringify(config.publicValues())).not.toContain(
      'synthetic-password',
    );
    expect(config.get('auth.passwordReset.enabled')).toBeUndefined();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  expect(example).not.toContain('emailChannel:');
});

it('accepts an entirely environment-configured shared sender without enabling recovery', async () => {
  const config = new AppConfig();
  await config.loadAll();
  const defaults = defaultAppConfigs({ auth, mailers });
  config.mergeDefaults(defaults({} as never));
  config.defineSections(defaults.sections!);
  await config.loadSectionEnvironment({
    MAILERS_DEFAULT: 'system',
    MAILERS_SYSTEM_PROVIDER: 'smtp',
    MAILERS_SYSTEM_HOST: 'localhost',
    MAILERS_SYSTEM_PORT: '2525',
    MAILERS_SYSTEM_SECURE: 'false',
  });
  expect(await config.validate()).toEqual([]);
  expect(config.get('mailers.system')).toMatchObject({
    provider: 'smtp',
    port: 2525,
    secure: false,
  });
  expect(config.get('auth.passwordReset.enabled')).toBeUndefined();
  expect(config.environmentVariableMappings()).toMatchObject({
    MAILERS_DEFAULT: { path: 'mailers.default' },
    MAILERS_SYSTEM_PASSWORD: {
      path: 'mailers.system.auth.pass',
      secret: true,
    },
  });
});

it('loads the direct password-reset reference from the inherited environment mapping', async () => {
  const config = new AppConfig();
  await config.loadAll();
  const defaults = defaultAppConfigs({ auth, mailers });
  config.mergeDefaults(defaults({} as never));
  config.defineSections(defaults.sections!);
  await config.loadSectionEnvironment({
    AUTH_PASSWORD_RESET_MAILER: 'system',
    MAILERS_SYSTEM_PROVIDER: 'smtp',
    MAILERS_SYSTEM_HOST: 'localhost',
    MAILERS_SYSTEM_PORT: '2525',
  });
  expect(await config.validate()).toEqual([]);
  expect(config.get('auth.passwordReset.mailer')).toBe('system');
  expect(config.get('auth.passwordReset.enabled')).toBeUndefined();
  expect(config.environmentVariableMappings()).toMatchObject({
    AUTH_PASSWORD_RESET_MAILER: { path: 'auth.passwordReset.mailer' },
  });
  expect(config.publicValues()).not.toHaveProperty('auth.passwordReset');
});
