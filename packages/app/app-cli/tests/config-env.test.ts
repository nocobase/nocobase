import { describe, expect, it } from 'vitest';

import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  envInteger,
  envString,
} from '@nocobase/app-server/config';

import AppConfigEnv from '../src/commands/config/env.ts';
import type { AppCommandRuntime } from '../src/context.ts';
import { runConfigEnv } from '../src/lib/config-env.ts';
import { bindAppCommand } from './app-command.ts';
import { runAppCommand } from './command-output.ts';

async function createRuntime(env: Record<string, string>): Promise<{
  readonly runtime: AppCommandRuntime;
  readonly destroyed: () => boolean;
}> {
  const config = new AppConfig();
  await config.loadAll();
  const sections = defaultAppConfigs({
    server: defineAppConfig({
      defaults: { port: 13000 },
      env: { APP_SERVER_PORT: envInteger('port') },
    }),
    auth: defineAppConfig({
      defaults: {},
      env: { AUTH_SECRET: envString('secret') },
    }),
  });
  config.mergeDefaults(sections({} as never));
  config.defineSections(sections.sections!);
  let destroyed = false;
  const runtime = {
    config,
    env,
    paths: { rootDir: '/nonexistent', deploymentRootDir: '/nonexistent' },
    scope: {
      destroy: async () => {
        destroyed = true;
      },
    },
  } as unknown as AppCommandRuntime;
  return { runtime, destroyed: () => destroyed };
}

describe('runConfigEnv', () => {
  it('lists declared and runtime-read variables, whether each is set, and never a value', async () => {
    const { runtime, destroyed } = await createRuntime({
      AUTH_SECRET: 'a-real-secret',
      APP_BASE_PATH: '/hub',
      APP_SERVER_PORT: '',
    });

    const { variables } = await runConfigEnv({
      loadRuntime: async () => runtime,
    });

    expect(variables.slice(0, 2)).toEqual([
      {
        name: 'AUTH_SECRET',
        path: 'auth.secret',
        set: true,
        secret: true,
        required: true,
      },
      {
        name: 'APP_SERVER_PORT',
        path: 'server.port',
        set: false,
        secret: false,
        required: false,
      },
    ]);
    expect(variables).toContainEqual(
      expect.objectContaining({ name: 'APP_BASE_PATH', set: true }),
    );
    expect(JSON.stringify(variables)).not.toContain('a-real-secret');
    expect(destroyed()).toBe(true);
  });
});

describe('config env --json', () => {
  it('returns the variables under result and destroys the runtime', async () => {
    const { runtime, destroyed } = await createRuntime({
      AUTH_SECRET: 'a-real-secret',
    });
    const rootDir = process.cwd();

    const output = await runAppCommand(
      bindAppCommand(AppConfigEnv, {
        rootDir,
        loadRuntime: async () => runtime,
      }),
      ['--json'],
      rootDir,
    );

    expect(output.json()).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        variables: expect.arrayContaining([
          expect.objectContaining({
            name: 'AUTH_SECRET',
            path: 'auth.secret',
            set: true,
          }),
        ]),
      },
    });
    expect(Object.keys(output.json().result as object)).toEqual(['variables']);
    expect(output.stdout).not.toContain('a-real-secret');
    expect(destroyed()).toBe(true);
  });
});
