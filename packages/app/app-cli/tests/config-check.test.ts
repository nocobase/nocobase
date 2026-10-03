// db-test-portability: sqlite-only — the application configuration under test names SQLite
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AppConfig,
  createAppPaths,
  defaultAppConfigs,
  defineAppConfig,
} from '@nocobase/app-server/config';
import { MissingDatabaseDriversError } from '@nocobase/app-server/database';
import sqliteDriver from '@nocobase/db-sqlite';

import AppConfigCheck from '../src/commands/config/check.ts';
import { CommandError } from '../src/command/errors.ts';
import type { AppCommandRuntime } from '../src/context.ts';
import { runConfigCheck } from '../src/lib/config-check.ts';
import { bindAppCommand } from './app-command.ts';
import { runAppCommand } from './command-output.ts';

const directories: string[] = [];

afterEach(async () => {
  while (directories.length > 0) {
    await rm(directories.pop()!, { recursive: true, force: true });
  }
});

const EXAMPLE = [
  'client:',
  '  app:',
  '    title: NocoBase',
  'auth:',
  '  secret: replace-with-a-unique-secret',
  '',
].join('\n');

interface Setup {
  /** Contents of config.yml; omitted for an application with no configuration file. */
  readonly file?: string;
  /** What the application declares in code, merged below the file. */
  readonly defaults?: Record<string, unknown>;
  /** Sections declared with defineAppConfig, whose rules the check enforces. */
  readonly sections?: Parameters<typeof defaultAppConfigs>[0];
}

/**
 * A runtime built from the real `AppConfig`, loaded from a real file and merged over code defaults the way the
 * application's own runtime does, so the check is asked about exactly the shape it will meet.
 */
async function createRuntime(setup: Setup): Promise<{
  readonly rootDir: string;
  readonly runtime: AppCommandRuntime;
  readonly destroyed: () => boolean;
}> {
  const rootDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-config-check-'),
  );
  directories.push(rootDir);
  await mkdir(path.join(rootDir, 'server'), { recursive: true });
  await writeFile(path.join(rootDir, 'server', 'runtime.ts'), 'export {};\n');
  await writeFile(path.join(rootDir, 'config.example.yml'), EXAMPLE);

  const config = new AppConfig();
  const file = path.join(rootDir, 'config.yml');
  if (setup.file !== undefined) await writeFile(file, setup.file);
  config.loadFile(file, { optional: true });
  await config.loadAll();
  config.mergeDefaults({
    auth: {},
    session: { enabled: true },
    database: {
      default: 'main',
      drivers: { sqlite: sqliteDriver },
      connections: {
        main: { dialect: 'sqlite', filename: path.join(rootDir, 'app.sqlite') },
      },
    },
    ...setup.defaults,
  });
  if (setup.sections) {
    const sections = defaultAppConfigs(setup.sections);
    config.mergeDefaults(sections({} as never));
    config.defineSections(sections.sections!);
  }

  let destroyed = false;
  const runtime = {
    config,
    paths: createAppPaths({ rootDir, deploymentRootDir: '.' }),
    scope: {
      destroy: async () => {
        destroyed = true;
      },
    },
  } as unknown as AppCommandRuntime;
  return { rootDir, runtime, destroyed: () => destroyed };
}

const SECRETS =
  'auth:\n  secret: a-real-secret\nsession:\n  secret: another-real-secret\n';

async function check(
  setup: Setup,
  connect: 'auto' | 'always' | 'never' = 'never',
) {
  const { rootDir, runtime, destroyed } = await createRuntime(setup);
  const result = await runConfigCheck({
    rootDir,
    loadRuntime: async () => runtime,
    connect,
    environment: {},
  });
  return { result, destroyed, rootDir };
}

describe('runConfigCheck', () => {
  it('reports what the sections declare and what the browser receives', async () => {
    const { result } = await check({
      file: `${SECRETS}billing:\n  trialDays: -1\n`,
      sections: {
        billing: defineAppConfig({
          defaults: { currency: 'USD', trialDays: 14 },
          validate(value, context) {
            if (value.trialDays < 0) {
              context.error('trialDays', 'must not be negative.', {
                fix: 'Set billing.trialDays to 0 or more.',
              });
            }
          },
          public: ['currency'],
        }),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.findings).toContainEqual({
      level: 'error',
      code: 'invalid',
      key: 'billing.trialDays',
      message: 'billing.trialDays must not be negative.',
      fix: 'Set billing.trialDays to 0 or more.',
    });
    expect(result.public).toEqual({ billing: { currency: 'USD' } });
  });

  it('passes a complete configuration and releases the runtime', async () => {
    const { result, destroyed, rootDir } = await check({ file: SECRETS });

    expect(result).toMatchObject({ ok: true, findings: [] });
    expect(result.configFile).toBe(path.join(rootDir, 'config.yml'));
    expect(destroyed()).toBe(true);
  });

  it('sends an unconfigured application to config:init', async () => {
    const { result } = await check({});

    expect(result.ok).toBe(false);
    expect(result.configFile).toBeUndefined();
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        code: 'secret-missing',
        key: 'auth.secret',
        fix: 'pnpm nocobase config init',
      }),
    );
  });

  it('rejects secrets still at the placeholder', async () => {
    const { result } = await check({
      file: 'auth:\n  secret: replace-with-a-unique-secret\nsession:\n  secret: replace-with-a-unique-secret\n',
    });

    expect(
      result.findings
        .filter((finding) => finding.code === 'secret-placeholder')
        .map((finding) => finding.key),
    ).toEqual(['auth.secret', 'session.secret']);
  });

  /** It starts, and every session ends with the process — worth saying, not worth failing for. */
  it('warns when sessions would run on a secret made up at every start', async () => {
    const { result } = await check({
      file: 'auth:\n  secret: a-real-secret\n',
    });

    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([
      expect.objectContaining({
        level: 'warning',
        code: 'session-secret-ephemeral',
      }),
    ]);
  });

  it('does not ask for a session secret when sessions are off', async () => {
    const { result } = await check({
      file: 'auth:\n  secret: a-real-secret\nsession:\n  enabled: false\n',
    });

    expect(result.findings).toEqual([]);
  });

  it('flags a misspelt section and suggests the one that was meant', async () => {
    const { result } = await check({ file: `${SECRETS}databse:\n  x: 1\n` });

    expect(result.findings).toEqual([
      expect.objectContaining({
        level: 'warning',
        code: 'unknown-key',
        key: 'databse',
        message: expect.stringContaining('Did you mean "database"?'),
      }),
    ]);
  });

  /** A section the example documents is known even when nothing in code defaults it. */
  it('knows the sections config.example.yml documents', async () => {
    const { result } = await check({
      file: `${SECRETS}client:\n  app:\n    title: Mine\n`,
    });

    expect(result.findings).toEqual([]);
  });

  it('flags a ${NAME} reference used as literal text in every section', async () => {
    const { result } = await check({
      file: [
        SECRETS.trimEnd(),
        'database:',
        '  connections:',
        '    main:',
        '      password: ${MAIN_DB_PASSWORD}',
        'ai:',
        '  llmServices:',
        '    openai:',
        '      options:',
        '        apiKey: ${OPENAI_API_KEY}',
        '',
      ].join('\n'),
      defaults: {
        ai: {},
        database: {
          default: 'main',
          drivers: { sqlite: sqliteDriver },
          connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
        },
      },
    });

    expect(
      result.findings
        .filter((finding) => finding.code === 'unexpanded-reference')
        .map((finding) => finding.key),
    ).toEqual([
      'database.connections.main.password',
      'ai.llmServices.openai.options.apiKey',
    ]);
  });

  describe('when the configuration does not load', () => {
    const load = async (error: unknown) => {
      const { rootDir } = await createRuntime({ file: SECRETS });
      return runConfigCheck({
        rootDir,
        loadRuntime: async () => {
          throw error;
        },
        environment: {},
      });
    };

    it('reports each connection missing its driver, with the command that installs it', async () => {
      const result = await load(
        new MissingDatabaseDriversError([
          {
            connection: 'main',
            dialect: 'postgres',
            packageName: '@nocobase/db-postgres',
          },
          {
            connection: 'analytics',
            dialect: 'mysql',
            packageName: '@nocobase/db-mysql',
          },
        ]),
      );

      expect(result.ok).toBe(false);
      expect(result.findings).toEqual([
        expect.objectContaining({
          code: 'driver-missing',
          key: 'database.connections.main',
          fix: 'pnpm add @nocobase/db-postgres',
        }),
        expect.objectContaining({
          code: 'driver-missing',
          key: 'database.connections.analytics',
          fix: 'pnpm add @nocobase/db-mysql',
        }),
      ]);
    });

    it('finds the missing drivers when the runtime wraps the error', async () => {
      const result = await load(
        new Error('Startup failed', {
          cause: new MissingDatabaseDriversError([
            {
              connection: 'main',
              dialect: 'postgres',
              packageName: '@nocobase/db-postgres',
            },
          ]),
        }),
      );

      expect(result.findings.map((finding) => finding.code)).toEqual([
        'driver-missing',
      ]);
    });

    it('reports anything else as a failed load, with its message', async () => {
      const result = await load(
        new Error('bad indentation of a mapping entry'),
      );

      expect(result.findings).toEqual([
        expect.objectContaining({
          code: 'load-failed',
          message: expect.stringContaining('bad indentation'),
        }),
      ]);
    });
  });

  describe('connections', () => {
    /** SQLite is a local file: there is nothing to reach, and opening it would create it. */
    it('leaves SQLite alone by default', async () => {
      const { result } = await check({ file: SECRETS }, 'auto');

      expect(result.connections).toEqual([
        { name: 'main', dialect: 'sqlite', status: 'skipped' },
      ]);
    });

    it('connects to SQLite too when asked', async () => {
      const { result } = await check({ file: SECRETS }, 'always');

      expect(result.connections).toEqual([
        { name: 'main', dialect: 'sqlite', status: 'ok' },
      ]);
    });

    it('reports a database it cannot open as an error', async () => {
      const { result } = await check(
        {
          file: SECRETS,
          defaults: {
            database: {
              default: 'main',
              drivers: { sqlite: sqliteDriver },
              connections: {
                main: {
                  dialect: 'sqlite',
                  filename: path.join(
                    os.tmpdir(),
                    'missing-directory-xyz',
                    'nested',
                    'app.sqlite',
                  ),
                },
              },
            },
          },
        },
        'always',
      );

      expect(result.ok).toBe(false);
      expect(result.connections[0]).toMatchObject({
        name: 'main',
        status: 'failed',
      });
      expect(result.findings).toContainEqual(
        expect.objectContaining({
          code: 'connection-failed',
          key: 'database.connections.main',
        }),
      );
    });
  });
});

describe('config check --json', () => {
  const run = async (
    setup: Setup,
    argv: readonly string[] = [],
    json = true,
  ) => {
    const { rootDir, runtime, destroyed } = await createRuntime(setup);
    const output = await runAppCommand(
      bindAppCommand(AppConfigCheck, {
        rootDir,
        loadRuntime: async () => runtime,
      }),
      [...(json ? ['--json'] : []), '--no-connect', ...argv],
      rootDir,
    );
    return { output, destroyed, rootDir };
  };

  it('returns findings, connections and what the browser receives', async () => {
    const { output, destroyed, rootDir } = await run({
      file: 'auth:\n  secret: a-real-secret\n',
    });

    expect(output.exitCode).toBeUndefined();
    expect(output.json()).toMatchObject({
      schemaVersion: 1,
      ok: true,
      status: 'success',
      result: {
        mode: 'source',
        configFile: path.join(rootDir, 'config.yml'),
        // A warning does not fail the check, and stays in the result.
        findings: [
          expect.objectContaining({
            level: 'warning',
            code: 'session-secret-ephemeral',
          }),
        ],
        connections: [],
        public: {},
      },
    });
    expect(output.json().result).not.toHaveProperty('ok');
    expect(destroyed()).toBe(true);
  });

  it('fails with CONFIG_INVALID and keeps every finding in details', async () => {
    const { output, destroyed } = await run({
      file: 'auth:\n  secret: replace-with-a-unique-secret\ndatabse:\n  x: 1\n',
    });

    expect(output.exitCode).toBe(1);
    const json = output.json();
    expect(json).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'CONFIG_INVALID',
        message: expect.stringContaining('1 error'),
        details: { mode: 'source', connections: [], public: {} },
      },
    });
    const { findings } = (json.error as { details: { findings: unknown[] } })
      .details;
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'error',
          code: 'secret-placeholder',
          key: 'auth.secret',
          fix: expect.any(String),
        }),
        expect.objectContaining({ level: 'warning', code: 'unknown-key' }),
      ]),
    );
    expect(destroyed()).toBe(true);
  });

  it('fails on warnings with --strict', async () => {
    const { output } = await run({ file: 'auth:\n  secret: a-real-secret\n' }, [
      '--strict',
    ]);

    expect(output.exitCode).toBe(1);
    expect(output.json()).toMatchObject({
      ok: false,
      error: {
        code: 'CONFIG_INVALID',
        message: expect.stringContaining('--strict'),
        details: {
          findings: [
            expect.objectContaining({ code: 'session-secret-ephemeral' }),
          ],
        },
      },
    });
  });

  it('reports a configuration that does not load as findings, not as its own error', async () => {
    const { rootDir } = await createRuntime({ file: SECRETS });
    const output = await runAppCommand(
      bindAppCommand(AppConfigCheck, {
        rootDir,
        loadRuntime: async () => {
          throw new MissingDatabaseDriversError([
            {
              connection: 'main',
              dialect: 'postgres',
              packageName: '@nocobase/db-postgres',
            },
          ]);
        },
      }),
      ['--json'],
      rootDir,
    );

    expect(output.json()).toMatchObject({
      ok: false,
      error: {
        code: 'CONFIG_INVALID',
        details: {
          findings: [
            expect.objectContaining({
              code: 'driver-missing',
              fix: 'pnpm add @nocobase/db-postgres',
            }),
          ],
        },
      },
    });
  });

  it('refuses a directory that holds no application with APPLICATION_NOT_FOUND and exit 2', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-empty-'));
    directories.push(rootDir);

    const output = await runAppCommand(
      bindAppCommand(AppConfigCheck, { rootDir }),
      ['--json'],
      rootDir,
    );

    expect(output.exitCode).toBe(2);
    expect(output.json()).toMatchObject({
      ok: false,
      error: { code: 'APPLICATION_NOT_FOUND' },
    });
  });

  it('prints the findings for people before failing', async () => {
    const { output } = await run(
      { file: 'auth:\n  secret: replace-with-a-unique-secret\n' },
      [],
      false,
    );

    expect(output.stdout).toContain(
      '✗ auth.secret: auth.secret is still the placeholder',
    );
    expect(output.error).toBeInstanceOf(CommandError);
    expect(output.error).toMatchObject({ oclif: { exit: 1 } });
  });
});
