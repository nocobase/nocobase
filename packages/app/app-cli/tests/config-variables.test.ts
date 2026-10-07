import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  envString,
} from '@nocobase/app-server/config';

import AppConfigVariables from '../src/commands/config/variables.ts';
import type { AppCommandRuntime } from '../src/context.ts';
import { runConfigVariables } from '../src/lib/config-variables.ts';
import { bindAppCommand } from './app-command.ts';
import { runAppCommand } from './command-output.ts';

const directories: string[] = [];

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

async function createRuntime(): Promise<{
  readonly runtime: AppCommandRuntime;
  readonly rootDir: string;
  readonly destroyed: () => boolean;
}> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'config-variables-'));
  directories.push(rootDir);
  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: 'crm', version: '1.4.0' }),
  );
  await writeFile(
    path.join(rootDir, 'config.example.yml'),
    'users:\n  initialAdmin:\n    username: nocobase\n    password: admin123\nmail:\n  from: a@example.com\n',
  );
  const config = new AppConfig();
  await config.loadAll();
  const sections = defaultAppConfigs({
    mail: defineAppConfig({
      defaults: {},
      env: {
        SMTP_PASSWORD: envString('password', { description: 'SMTP password' }),
        MAIL_FROM: envString('from'),
      },
    }),
    users: defineAppConfig({
      defaults: {},
      env: {
        INITIAL_ADMIN_USERNAME: envString('initialAdmin.username'),
        INITIAL_ADMIN_PASSWORD: envString('initialAdmin.password'),
      },
    }),
  });
  config.mergeDefaults(sections({} as never));
  config.defineSections(sections.sections!);
  let destroyed = false;
  const runtime = {
    config,
    env: { SMTP_PASSWORD: 'never-printed' },
    paths: { rootDir, deploymentRootDir: rootDir },
    scope: {
      destroy: async () => {
        destroyed = true;
      },
    },
  } as unknown as AppCommandRuntime;
  return { runtime, rootDir, destroyed: () => destroyed };
}

describe('runConfigVariables', () => {
  it('infers required variables from defaults and the example, ignoring placeholders', async () => {
    const { runtime, rootDir, destroyed } = await createRuntime();
    const out = path.join(rootDir, 'dist', 'variables.json');

    const { manifest, file } = await runConfigVariables({
      loadRuntime: async () => runtime,
      out,
    });

    expect(file).toBe(out);
    expect(JSON.parse(await readFile(out, 'utf8'))).toEqual(manifest);
    expect(manifest.app).toEqual({ name: 'crm', version: '1.4.0' });
    const byName = new Map(
      manifest.variables.map((entry) => [entry.name, entry]),
    );
    expect(byName.get('SMTP_PASSWORD')).toMatchObject({
      path: 'mail.password',
      description: 'SMTP password',
      secret: true,
      required: true,
    });
    expect(byName.get('MAIL_FROM')).toMatchObject({
      required: false,
      exampleProvided: true,
    });
    expect(byName.get('INITIAL_ADMIN_USERNAME')?.required).toBe(false);
    expect(byName.get('INITIAL_ADMIN_PASSWORD')).toMatchObject({
      required: true,
      exampleProvided: false,
    });
    expect(byName.get('APP_BASE_PATH')?.runtime).toBe(true);
    expect(JSON.stringify(manifest)).not.toContain('never-printed');
    expect(destroyed()).toBe(true);
  });
});

describe('config variables --json', () => {
  it('returns the manifest under result', async () => {
    const { runtime, rootDir } = await createRuntime();

    const output = await runAppCommand(
      bindAppCommand(AppConfigVariables, {
        rootDir,
        loadRuntime: async () => runtime,
      }),
      ['--json'],
      rootDir,
    );

    expect(output.json()).toMatchObject({
      ok: true,
      result: { manifest: { schemaVersion: 1, app: { name: 'crm' } } },
    });
  });
});
