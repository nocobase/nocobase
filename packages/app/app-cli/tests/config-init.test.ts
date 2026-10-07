// db-test-portability: sqlite-only — the configuration that `config init` writes names a SQLite database
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

import AppConfigInit from '../src/commands/config/init.ts';
import type { AppCommandRuntime } from '../src/context.ts';
import {
  ConfigInitError,
  findAvailableDialects,
  installCommand,
  runConfigInit,
} from '../src/lib/config-init.ts';
import { bindAppCommand } from './app-command.ts';
import { runAppCommand } from './command-output.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  while (temporaryDirectories.length > 0) {
    await rm(temporaryDirectories.pop()!, { recursive: true, force: true });
  }
});

const EXAMPLE = [
  '# Copy this file to config.yml before starting the application.',
  'client:',
  '  app:',
  '    title: NocoBase',
  'secrets:',
  '  # Generate a unique key.',
  '  keys:',
  '    - version: 1',
  '      key: replace-with-a-unique-secret',
  'database:',
  '  default: main',
  '  connections:',
  '    main:',
  '      dialect: sqlite',
  '      database: database.sqlite',
  '      schemaManagement: managed',
  '      migrations:',
  '        autoRun: true',
  '    analytics:',
  '      dialect: sqlite',
  '      database: analytics.sqlite',
  '',
].join('\n');

/**
 * Builds a directory that looks enough like an application for the command: the runtime module whose extension tells
 * source from deployment, the example the file is generated from, and a `node_modules` holding the drivers named.
 */
async function createApplication(options: {
  readonly mode?: 'source' | 'deployment';
  readonly drivers?: readonly string[];
  readonly example?: string | null;
}): Promise<{ readonly rootDir: string; readonly deploymentRootDir: string }> {
  const base = await mkdtemp(path.join(os.tmpdir(), 'nocobase-config-init-'));
  temporaryDirectories.push(base);
  const mode = options.mode ?? 'source';
  // A deployment runs out of `dist`, with its configuration and example one level up beside it.
  const rootDir = mode === 'source' ? base : path.join(base, 'dist');
  const deploymentRootDir = base;

  await mkdir(path.join(rootDir, 'server'), { recursive: true });
  await writeFile(
    path.join(
      rootDir,
      'server',
      mode === 'source' ? 'runtime.ts' : 'runtime.js',
    ),
    'export default {};\n',
  );

  if (options.example !== null) {
    await writeFile(
      path.join(deploymentRootDir, 'config.example.yml'),
      options.example ?? EXAMPLE,
    );
  }

  const drivers = options.drivers ?? [];
  if (mode === 'deployment') {
    await writeFile(
      path.join(rootDir, 'package.json'),
      `${JSON.stringify({
        name: 'app',
        dependencies: Object.fromEntries(
          drivers.map((dialect) => [`@nocobase/db-${dialect}`, '1.0.0']),
        ),
      })}\n`,
    );
  }

  for (const dialect of drivers) {
    await mkdir(
      path.join(rootDir, 'node_modules', '@nocobase', `db-${dialect}`),
      { recursive: true },
    );
  }

  return { rootDir, deploymentRootDir };
}

describe('runConfigInit', () => {
  it('writes the configuration beside the application and fills the secrets key', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    const result = await runConfigInit({ rootDir, environment: {} });

    expect(result.dialect).toBe('sqlite');
    expect(result.mode).toBe('source');
    expect(result.configFile).toBe(path.join(rootDir, 'config.yml'));

    const written = await readFile(result.configFile, 'utf8');
    expect(written).not.toContain('replace-with-a-unique-secret');
    const parsed = parse(written) as {
      secrets: { keys: { version: number; key: string }[] };
    };
    expect(parsed.secrets.keys).toEqual([
      { version: 1, key: expect.stringMatching(/^[0-9a-f]{64}$/u) },
    ]);
  });

  it('applies the selected dialect and leaves the other connections alone', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'postgres'],
    });

    const result = await runConfigInit({
      rootDir,
      dialect: 'postgres',
      environment: {},
    });

    const parsed = parse(await readFile(result.configFile, 'utf8')) as {
      database: {
        default: string;
        connections: Record<string, Record<string, unknown>>;
      };
    };
    expect(parsed.database.connections.main).toMatchObject({
      dialect: 'postgres',
      port: 5432,
      schema: 'public',
      schemaManagement: 'managed',
    });
    // The policy the example set on the main connection survives the replacement.
    expect(parsed.database.connections.main.migrations).toEqual({
      autoRun: true,
    });
    // A second connection belongs to the application, not to the dialect choice.
    expect(parsed.database.connections.analytics).toMatchObject({
      dialect: 'sqlite',
    });
  });

  /**
   * The property the whole command is ordered around: a run that cannot finish must leave nothing behind, or the
   * retry after installing the driver would be refused for an application that is "already configured".
   */
  it('writes nothing when the driver is missing, and succeeds when it appears', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    await expect(
      runConfigInit({ rootDir, dialect: 'postgres', environment: {} }),
    ).rejects.toMatchObject({
      reason: 'driver-missing',
      suggestion: {
        message: 'Install the driver:',
        run: { command: 'pnpm', args: ['add', '@nocobase/db-postgres'] },
      },
    });
    expect(existsSync(path.join(rootDir, 'config.yml'))).toBe(false);

    await mkdir(
      path.join(rootDir, 'node_modules', '@nocobase', 'db-postgres'),
      { recursive: true },
    );

    const result = await runConfigInit({
      rootDir,
      dialect: 'postgres',
      environment: {},
    });
    expect(result.dialect).toBe('postgres');
  });

  /**
   * A bare `pnpm add` installs the newest driver, which during a prerelease can be one the installed runtime was never
   * built against. The runtime already declares the range it supports for every official driver.
   */
  it('pins the suggested install to the range the installed runtime accepts', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    const runtime = path.join(
      rootDir,
      'node_modules',
      '@nocobase',
      'app-server',
    );
    await mkdir(runtime, { recursive: true });
    await writeFile(
      path.join(runtime, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-server',
        peerDependencies: {
          '@nocobase/db-postgres': '^1.2.0-beta.3',
          '@nocobase/db-mysql': '>=1.0.0 <2.0.0',
          '@nocobase/db-oracle': 'workspace:^',
        },
      }),
    );

    const suggestion = async (dialect: string) =>
      runConfigInit({ rootDir, dialect, environment: {} }).catch(
        (error: ConfigInitError) => error.suggestion?.run,
      );

    expect(await suggestion('postgres')).toEqual({
      command: 'pnpm',
      args: ['add', '@nocobase/db-postgres@^1.2.0-beta.3'],
    });
    // A range with spaces is one argument, so nothing has to quote it.
    expect(await suggestion('mysql')).toEqual({
      command: 'pnpm',
      args: ['add', '@nocobase/db-mysql@>=1.0.0 <2.0.0'],
    });
    // A workspace protocol means nothing outside this repository, so it is not repeated back.
    expect(await suggestion('oracle')).toEqual({
      command: 'pnpm',
      args: ['add', '@nocobase/db-oracle'],
    });

    // The one-line form a config check finding carries has to reach pnpm as a single argument too.
    expect(installCommand(rootDir, '@nocobase/db-mysql')).toBe(
      'pnpm add "@nocobase/db-mysql@>=1.0.0 <2.0.0"',
    );
    expect(installCommand(rootDir, '@nocobase/db-postgres')).toBe(
      'pnpm add @nocobase/db-postgres@^1.2.0-beta.3',
    );
  });

  it('reports having no driver at all with the command that installs one', async () => {
    const { rootDir } = await createApplication({ drivers: [] });

    await expect(
      runConfigInit({ rootDir, environment: {} }),
    ).rejects.toMatchObject({
      reason: 'no-drivers',
      suggestion: {
        run: { command: 'pnpm', args: ['add', '@nocobase/db-sqlite'] },
      },
    });
  });

  it('rejects a dialect the runtime has no loader for', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    await expect(
      runConfigInit({ rootDir, dialect: 'cockroach', environment: {} }),
    ).rejects.toMatchObject({ reason: 'unknown-dialect' });
  });

  /** Without a terminal the choice cannot be asked for, so the flag that would have supplied it is named instead. */
  it('requires --dialect when several drivers are installed and nothing can ask', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'mysql'],
    });

    await expect(
      runConfigInit({ rootDir, environment: {} }),
    ).rejects.toMatchObject({
      reason: 'dialect-required',
    });
  });

  it('asks which driver to use when it can, and only offers installed ones', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'mysql'],
    });
    const offered: string[][] = [];

    const result = await runConfigInit({
      rootDir,
      environment: {},
      selectDialect: async (available) => {
        offered.push([...available]);
        return 'mysql';
      },
    });

    expect(offered).toEqual([['sqlite', 'mysql']]);
    expect(result.dialect).toBe('mysql');
  });

  /**
   * Re-running a setup sequence after it failed part-way through is what agents and people both do, so the step that
   * already succeeded succeeds again instead of stopping the sequence. All four extensions count: the runtime probes
   * them all, and writing config.yml beside an existing config.toml would produce a file nothing reads.
   */
  it.each(['yml', 'yaml', 'toml', 'json'])(
    'leaves an existing config.%s alone and reports it unchanged',
    async (extension) => {
      const { rootDir } = await createApplication({ drivers: ['sqlite'] });
      const existing = path.join(rootDir, `config.${extension}`);
      await writeFile(existing, 'kept');

      const result = await runConfigInit({ rootDir, environment: {} });

      expect(result).toMatchObject({
        status: 'unchanged',
        configFile: existing,
        nextCommands: ['pnpm nocobase config check', 'pnpm dev'],
      });
      expect(await readFile(existing, 'utf8')).toBe('kept');
    },
  );

  it('reports the same dialect as unchanged too', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    await writeFile(path.join(rootDir, 'config.yml'), 'kept');

    await expect(
      runConfigInit({
        rootDir,
        dialect: 'sqlite',
        environment: {},
        readConfiguredDialect: async () => 'sqlite',
      }),
    ).resolves.toMatchObject({ status: 'unchanged', dialect: 'sqlite' });
  });

  /** Reporting success here would claim a change to the database that never happened. */
  it('refuses a different dialect for an application already configured', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'postgres'],
    });
    await writeFile(path.join(rootDir, 'config.yml'), 'kept');

    await expect(
      runConfigInit({
        rootDir,
        dialect: 'postgres',
        environment: {},
        readConfiguredDialect: async () => 'sqlite',
      }),
    ).rejects.toMatchObject({
      reason: 'already-configured',
      message: expect.stringContaining('configured for sqlite'),
      details: { configuredDialect: 'sqlite', requestedDialect: 'postgres' },
    });
    expect(await readFile(path.join(rootDir, 'config.yml'), 'utf8')).toBe(
      'kept',
    );
  });

  /** When the configured dialect cannot be read, a --dialect cannot be confirmed as the same one, so it is refused. */
  it('refuses --dialect when the existing configuration cannot be read', async () => {
    const { rootDir } = await createApplication({ drivers: [] });
    await writeFile(path.join(rootDir, 'config.yml'), 'kept');

    await expect(
      runConfigInit({
        rootDir,
        dialect: 'postgres',
        environment: {},
        readConfiguredDialect: async () => {
          throw new Error('does not load');
        },
      }),
    ).rejects.toMatchObject({ reason: 'already-configured' });
  });

  /**
   * Existing configuration is the first thing reported. Asking which dialect to use, or saying a driver is missing,
   * before mentioning that the file is already there would have someone decide something that was never used.
   */
  it('reports existing configuration before asking anything', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'mysql'],
    });
    await writeFile(path.join(rootDir, 'config.yml'), 'auth:\n  secret: x\n');
    let asked = false;

    const result = await runConfigInit({
      rootDir,
      environment: {},
      selectDialect: async () => {
        asked = true;
        return 'mysql';
      },
    });

    expect(result).toMatchObject({
      status: 'unchanged',
      configFile: path.join(rootDir, 'config.yml'),
    });
    expect(asked).toBe(false);
  });

  it('lists the placeholder settings a database other than SQLite still needs', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'postgres'],
    });

    const sqlite = await runConfigInit({
      rootDir,
      dialect: 'sqlite',
      environment: {},
    });
    expect(sqlite.requiredSettings).toEqual([]);
    await rm(sqlite.configFile);

    const postgres = await runConfigInit({
      rootDir,
      dialect: 'postgres',
      environment: {},
    });
    expect(postgres).toMatchObject({
      status: 'configured',
      nextCommands: ['pnpm nocobase config check', 'pnpm dev'],
      requiredSettings: [
        'database.connections.main.host',
        'database.connections.main.port',
        'database.connections.main.database',
        'database.connections.main.username',
        'database.connections.main.password',
      ],
    });
  });

  it('writes the connection settings it was given and stops listing them', async () => {
    const { rootDir } = await createApplication({ drivers: ['postgres'] });
    const offered: Record<string, unknown>[] = [];

    const result = await runConfigInit({
      rootDir,
      dialect: 'postgres',
      environment: {},
      askConnection: async (_dialect, defaults) => {
        offered.push({ ...defaults });
        return {
          host: 'db.internal',
          port: 6543,
          username: 'crm',
          password: 's3cret',
        };
      },
    });

    expect(offered[0]).toMatchObject({ host: 'localhost', port: 5432 });
    expect(result.requiredSettings).toEqual([
      'database.connections.main.database',
    ]);
    const parsed = parse(await readFile(result.configFile, 'utf8')) as {
      database: { connections: { main: Record<string, unknown> } };
    };
    expect(parsed.database.connections.main).toMatchObject({
      host: 'db.internal',
      port: 6543,
      username: 'crm',
      password: 's3cret',
    });
  });

  /** A declined write after a failed connection leaves nothing behind, like every other failure. */
  it('tests the connection first and writes nothing when that is declined', async () => {
    const { rootDir } = await createApplication({ drivers: ['postgres'] });
    const tested: unknown[] = [];

    await expect(
      runConfigInit({
        rootDir,
        dialect: 'postgres',
        environment: {},
        askConnection: async () => ({ host: '127.0.0.1', port: 1 }),
        onConnectionTested: async (result) => {
          tested.push(result);
          return false;
        },
      }),
    ).rejects.toMatchObject({ reason: 'cancelled' });

    expect(tested).toEqual([
      expect.objectContaining({
        name: 'main',
        dialect: 'postgres',
        status: 'failed',
      }),
    ]);
    expect(existsSync(path.join(rootDir, 'config.yml'))).toBe(false);
  });

  it('never asks about a SQLite connection', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    let asked = false;

    await runConfigInit({
      rootDir,
      environment: {},
      askConnection: async () => {
        asked = true;
        return {};
      },
      onConnectionTested: async () => {
        asked = true;
        return true;
      },
    });

    expect(asked).toBe(false);
  });

  it('replaces an existing file with --force', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    await writeFile(path.join(rootDir, 'config.yml'), 'stale: true\n');

    const result = await runConfigInit({
      rootDir,
      force: true,
      environment: {},
    });

    expect(await readFile(result.configFile, 'utf8')).not.toContain('stale');
  });

  it('resolves --config against the root the runtime was given', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    await mkdir(path.join(rootDir, 'etc'), { recursive: true });

    const result = await runConfigInit({
      rootDir,
      configPath: 'etc/app.yml',
      environment: {},
    });

    expect(result.configFile).toBe(path.join(rootDir, 'etc', 'app.yml'));
    expect(existsSync(result.configFile)).toBe(true);
  });

  it('names the missing directory rather than failing on the write', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    await expect(
      runConfigInit({ rootDir, configPath: 'etc/app.yml', environment: {} }),
    ).rejects.toMatchObject({ reason: 'directory-missing' });
  });

  /** Environment values are applied after the file, so a secret set there is the one that will actually be used. */
  it('reports the environment variables that override what it wrote', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    const result = await runConfigInit({
      rootDir,
      environment: { SECRETS_KEYS: `1:${'e'.repeat(64)}`, AUTH_SECRET: 'x' },
    });

    expect(result.overriddenByEnvironment).toEqual(['SECRETS_KEYS']);
  });

  it('still writes usable secrets for an application with no example', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite'],
      example: null,
    });

    const result = await runConfigInit({ rootDir, environment: {} });
    const parsed = parse(await readFile(result.configFile, 'utf8')) as {
      secrets: { keys: { version: number; key: string }[] };
    };

    expect(parsed.secrets.keys[0]!.key).toMatch(/^[0-9a-f]{64}$/u);
  });

  describe('in a deployment', () => {
    it('writes beside dist and reads the dialects the build carried', async () => {
      const { rootDir, deploymentRootDir } = await createApplication({
        mode: 'deployment',
        drivers: ['postgres'],
      });

      expect(await findAvailableDialects(rootDir, 'deployment')).toEqual([
        'postgres',
      ]);

      const result = await runConfigInit({ rootDir, environment: {} });

      expect(result.mode).toBe('deployment');
      expect(result.configFile).toBe(
        path.join(deploymentRootDir, 'config.yml'),
      );
      expect(result.dialect).toBe('postgres');
    });

    /** Nothing here can install a driver, so the remedy is in the application sources rather than a pnpm command. */
    it('does not suggest installing a driver it cannot install', async () => {
      const { rootDir } = await createApplication({
        mode: 'deployment',
        drivers: ['postgres'],
      });

      const error = await runConfigInit({
        rootDir,
        dialect: 'mysql',
        environment: {},
      }).catch((cause: unknown) => cause as ConfigInitError);

      expect(error).toBeInstanceOf(ConfigInitError);
      expect(error.reason).toBe('driver-missing');
      expect(error.suggestion).toBeUndefined();
      expect(error.message).toContain('build again');
    });
  });

  it('fails clearly when the directory holds no application', async () => {
    const base = await mkdtemp(path.join(os.tmpdir(), 'nocobase-empty-'));
    temporaryDirectories.push(base);

    await expect(
      runConfigInit({ rootDir: base, environment: {} }),
    ).rejects.toMatchObject({ reason: 'application-not-found' });
  });
});

describe('config init --json', () => {
  const run = (
    rootDir: string,
    argv: readonly string[],
    loadRuntime?: () => Promise<AppCommandRuntime>,
  ) =>
    runAppCommand(
      bindAppCommand(AppConfigInit, { rootDir, loadRuntime }),
      ['--json', ...argv],
      rootDir,
    );

  it('reports a written configuration as success, with its fields under result', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    const output = await run(rootDir, []);

    expect(output.exitCode).toBeUndefined();
    expect(output.json()).toMatchObject({
      schemaVersion: 1,
      ok: true,
      status: 'success',
      result: {
        mode: 'source',
        dialect: 'sqlite',
        configFile: path.join(rootDir, 'config.yml'),
        configKey: 'database.connections.main',
        requiredSettings: [],
        nextCommands: ['pnpm nocobase config check', 'pnpm dev'],
      },
      warnings: [],
    });
    expect(output.json().result).not.toHaveProperty('status');
    expect(existsSync(path.join(rootDir, 'config.yml'))).toBe(true);
  });

  it('reports an application already configured as success-noop', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    await writeFile(path.join(rootDir, 'config.yml'), 'kept');

    const output = await run(rootDir, []);

    expect(output.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: { configFile: path.join(rootDir, 'config.yml') },
    });
  });

  it('refuses a missing driver with DRIVER_MISSING and the pnpm add that installs it', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });

    const output = await run(rootDir, ['--dialect', 'postgres']);

    expect(output.exitCode).toBe(1);
    expect(output.json()).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'DRIVER_MISSING',
        message: 'The postgres driver is not installed.',
        suggestions: [
          {
            message: 'Install the driver:',
            run: { command: 'pnpm', args: ['add', '@nocobase/db-postgres'] },
          },
        ],
        details: {
          dialect: 'postgres',
          missingDrivers: ['@nocobase/db-postgres'],
        },
      },
    });
    expect(existsSync(path.join(rootDir, 'config.yml'))).toBe(false);
  });

  it('refuses a different dialect with ALREADY_CONFIGURED, reading it through a runtime it destroys', async () => {
    const { rootDir } = await createApplication({
      drivers: ['sqlite', 'postgres'],
    });
    await writeFile(path.join(rootDir, 'config.yml'), 'kept');
    const destroy = vi.fn(async () => undefined);
    const runtime = {
      config: {
        get: () => ({
          default: 'main',
          connections: { main: { dialect: 'sqlite' } },
        }),
      },
      scope: { destroy },
    } as unknown as AppCommandRuntime;

    const output = await run(
      rootDir,
      ['--dialect', 'postgres'],
      async () => runtime,
    );

    expect(output.json()).toMatchObject({
      ok: false,
      error: {
        code: 'ALREADY_CONFIGURED',
        details: {
          configFile: path.join(rootDir, 'config.yml'),
          configuredDialect: 'sqlite',
          requestedDialect: 'postgres',
        },
      },
    });
    expect(output.exitCode).toBe(1);
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('refuses an application it cannot find with APPLICATION_NOT_FOUND', async () => {
    const base = await mkdtemp(path.join(os.tmpdir(), 'nocobase-empty-'));
    temporaryDirectories.push(base);

    const output = await run(base, []);

    expect(output.json()).toMatchObject({
      ok: false,
      error: { code: 'APPLICATION_NOT_FOUND' },
    });
    expect(output.exitCode).toBe(1);
  });

  /** --config is not an appPath(): like APP_CONFIG_FILE, it names a path inside the application. */
  it('resolves --config against the application root, wherever the command runs', async () => {
    const { rootDir } = await createApplication({ drivers: ['sqlite'] });
    await mkdir(path.join(rootDir, 'etc'), { recursive: true });
    const elsewhere = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cwd-'));
    temporaryDirectories.push(elsewhere);
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(elsewhere);
    try {
      const output = await run(rootDir, ['--config', 'etc/app.yml']);

      expect(output.json()).toMatchObject({
        ok: true,
        result: { configFile: path.join(rootDir, 'etc', 'app.yml') },
      });
    } finally {
      cwd.mockRestore();
    }
    expect(existsSync(path.join(rootDir, 'etc', 'app.yml'))).toBe(true);
  });
});
