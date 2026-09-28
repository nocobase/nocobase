// @vitest-environment node
// `nocobase commands`: the assembled command tree as data, so an agent reads one document instead of every `--help`.
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { Args, Flags } from '@oclif/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Commands from '../src/commands/commands.ts';
import { AppCommand, appPath } from '../src/index.ts';
import { defineCliPlugin, defineCliPlugins } from '../src/plugins/index.ts';
import type { AppCliCommand } from '../src/plugins/types.ts';
import { assembleCli } from '../src/runtime/assemble.ts';
import {
  DEVELOPMENT_TOPICS,
  RESERVED_TOPICS,
  builtinTopicsFor,
  loadBuiltinCommands,
} from '../src/runtime/builtin.ts';
import {
  describeCommandTree,
  formatCommandCatalog,
  type CommandCatalog,
  type CommandInfo,
} from '../src/runtime/catalog.ts';
import { resolvedCli, setResolvedCli } from '../src/runtime/command-store.ts';
import { bindAppCommand, runAppCommand } from '../src/testing.ts';

class SyncOrders extends AppCommand {
  static override summary = 'Sync orders from the shop.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --since 2026-01-01',
    {
      command: '<%= config.bin %> <%= command.id %> --json',
      description: 'For a script.',
    },
  ];
  static override args = {
    shop: Args.string({ description: 'The shop to read.', required: true }),
  };
  static override flags = {
    since: Flags.string({ char: 's', description: 'Only orders after.' }),
    mode: Flags.string({
      description: 'How to write.',
      options: ['merge', 'replace'],
      default: 'merge',
    }),
    tag: Flags.string({ description: 'Tags to add.', multiple: true }),
    limit: Flags.integer({
      description: 'At most this many.',
      default: async () => 10,
    }),
    'dry-run': Flags.boolean({ description: 'Preview.', default: false }),
    secret: Flags.string({ description: 'Internal.', hidden: true }),
  };
  public async run(): Promise<void> {
    await this.parse(SyncOrders);
  }
}

class AuditRun extends AppCommand {
  static override summary = 'Run the audit.';
  static override flags = {
    force: Flags.boolean({ description: 'Skip the check.', allowNo: true }),
  };
  public async run(): Promise<void> {
    await this.parse(AuditRun);
  }
}

class AuditBuild extends AppCommand {
  static override summary = 'Build audit artifacts.';
  public async run(): Promise<void> {
    await this.parse(AuditBuild);
  }
}

class Hidden extends AppCommand {
  static override hidden = true;
  public async run(): Promise<void> {
    await this.parse(Hidden);
  }
}

const plugins = defineCliPlugins([
  defineCliPlugin({
    packageName: '@acme/app-plugin-audit-log',
    description: 'Audit log exports.',
    commands: { run: AuditRun },
    devCommands: { build: AuditBuild },
  }),
]);

async function catalogFor(
  kind: 'source' | 'deployment',
): Promise<CommandCatalog> {
  const builtinCommands = await loadBuiltinCommands({ kind });
  return describeCommandTree(
    assembleCli({
      builtinCommands,
      builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
      commands: { 'sync-orders': SyncOrders, secret: Hidden },
      plugins,
      deployment: kind === 'deployment',
      reservedTopics: RESERVED_TOPICS,
      developmentTopics: DEVELOPMENT_TOPICS,
    }),
    { bin: 'nocobase' },
  );
}

function find(catalog: CommandCatalog, id: string): CommandInfo | undefined {
  return catalog.commands.find((command) => command.id === id);
}

describe('the catalog', () => {
  let source: CommandCatalog;
  let deployment: CommandCatalog;

  beforeAll(async () => {
    source = await catalogFor('source');
    deployment = await catalogFor('deployment');
  });

  it('marks an appPath() default as relative to the application root, as --help does', () => {
    class Build extends AppCommand {
      static override flags = {
        output: appPath({ default: 'dist/out', description: 'Where.' }),
        extra: appPath({ description: 'Typed only.' }),
      };
      public async run(): Promise<void> {
        await this.parse(Build);
      }
    }
    const catalog = describeCommandTree(
      assembleCli({
        builtinCommands: {},
        builtinTopics: {},
        commands: { build: Build },
      }),
      { bin: 'nocobase' },
    );
    expect(find(catalog, 'app build')?.flags).toEqual([
      {
        name: 'output',
        type: 'option',
        description: 'Where.',
        required: false,
        multiple: false,
        default: 'dist/out',
        defaultRelativeTo: 'application-root',
      },
      {
        name: 'extra',
        type: 'option',
        description: 'Typed only.',
        required: false,
        multiple: false,
      },
    ]);
  });

  it('lists built-in, app and plugin commands with their source, sorted by id', () => {
    const ids = source.commands.map((command) => command.id);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
    expect(find(source, 'db apply')).toMatchObject({
      source: 'builtin',
      json: true,
    });
    expect(find(source, 'commands')).toMatchObject({ source: 'builtin' });
    expect(find(source, 'app sync-orders')).toMatchObject({ source: 'app' });
    expect(find(source, 'audit-log run')).toMatchObject({
      source: 'plugin',
      package: '@acme/app-plugin-audit-log',
    });
    expect(find(source, 'app sync-orders')).not.toHaveProperty('package');
  });

  it('describes arguments, flags and examples', () => {
    expect(find(source, 'app sync-orders')).toEqual({
      id: 'app sync-orders',
      summary: 'Sync orders from the shop.',
      description: null,
      source: 'app',
      developmentOnly: false,
      json: true,
      dryRun: true,
      force: false,
      args: [
        { name: 'shop', description: 'The shop to read.', required: true },
      ],
      flags: [
        {
          name: 'since',
          char: 's',
          type: 'option',
          description: 'Only orders after.',
          required: false,
          multiple: false,
        },
        {
          name: 'mode',
          type: 'option',
          description: 'How to write.',
          required: false,
          multiple: false,
          default: 'merge',
          options: ['merge', 'replace'],
        },
        {
          name: 'tag',
          type: 'option',
          description: 'Tags to add.',
          required: false,
          multiple: true,
        },
        {
          name: 'limit',
          type: 'option',
          description: 'At most this many.',
          required: false,
          multiple: false,
        },
        {
          name: 'dry-run',
          type: 'boolean',
          description: 'Preview.',
          required: false,
          multiple: false,
          default: false,
        },
      ],
      examples: [
        { command: 'nocobase app sync-orders --since 2026-01-01' },
        {
          command: 'nocobase app sync-orders --json',
          description: 'For a script.',
        },
      ],
    });
    expect(find(source, 'audit-log run')).toMatchObject({
      force: true,
      flags: [{ name: 'force', type: 'boolean', allowNo: true }],
    });
  });

  it('leaves out hidden commands and hidden flags', () => {
    expect(find(source, 'app secret')).toBeUndefined();
    expect(
      find(source, 'app sync-orders')?.flags.map((flag) => flag.name),
    ).not.toContain('secret');
  });

  it('marks development-only commands', () => {
    expect(find(source, 'build')?.developmentOnly).toBe(true);
    expect(find(source, 'plugin register')?.developmentOnly).toBe(true);
    expect(find(source, 'audit-log build')?.developmentOnly).toBe(true);
    expect(find(source, 'db apply')?.developmentOnly).toBe(false);
    expect(find(source, 'commands')?.developmentOnly).toBe(false);
    expect(find(source, 'audit-log run')?.developmentOnly).toBe(false);
  });

  it('has no development commands in a deployment', () => {
    const ids = deployment.commands.map((command) => command.id);
    for (const id of ['build', 'dev', 'plugin register', 'audit-log build']) {
      expect(ids).not.toContain(id);
    }
    expect(find(deployment, 'db apply')).toBeDefined();
    expect(find(deployment, 'commands')).toBeDefined();
    expect(find(deployment, 'app sync-orders')).toBeDefined();
    expect(find(deployment, 'audit-log run')).toBeDefined();
    expect(
      deployment.commands.filter((command) => command.developmentOnly),
    ).toEqual([]);
  });

  it('lists topics with their source', () => {
    expect(source.topics).toEqual(
      expect.arrayContaining([
        {
          name: 'db',
          description: expect.any(String),
          source: 'builtin',
        },
        { name: 'app', description: expect.any(String), source: 'app' },
        {
          name: 'audit-log',
          description: 'Audit log exports.',
          source: 'plugin',
          package: '@acme/app-plugin-audit-log',
        },
      ]),
    );
    expect(deployment.topics.map((topic) => topic.name)).not.toContain(
      'plugin',
    );
  });

  it('groups ids and summaries by topic for people', () => {
    const text = formatCommandCatalog(source);
    expect(text).toMatch(/^Commands\n {2}build +\S/u);
    expect(text).toContain('\n\naudit-log: Audit log exports.\n');
    expect(text).toMatch(/\n {2}app sync-orders +Sync orders from the shop\./u);
  });
});

describe('the command', () => {
  let previous: ReturnType<typeof resolvedCli>;
  let root: string;

  beforeAll(async () => {
    previous = resolvedCli();
    root = await mkdtemp(path.join(os.tmpdir(), 'command-catalog-'));
  });
  afterAll(async () => {
    if (previous !== undefined) setResolvedCli(previous);
    await rm(root, { recursive: true, force: true });
  });

  it('answers --json with the catalog in the envelope', async () => {
    const builtinCommands: Record<string, AppCliCommand> = {
      commands: Commands,
    };
    setResolvedCli(
      assembleCli({
        builtinCommands,
        builtinTopics: {},
        commands: { 'sync-orders': SyncOrders },
        developmentTopics: DEVELOPMENT_TOPICS,
      }),
    );
    const run = await runAppCommand(
      bindAppCommand(Commands, { rootDir: root, id: 'commands' }),
      ['--json'],
    );
    expect(run.exitCode).toBeUndefined();
    expect(run.json()).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'commands',
      status: 'success',
      result: {
        commands: [
          { id: 'app sync-orders', source: 'app' },
          { id: 'commands', source: 'builtin', json: true },
        ],
        topics: [{ name: 'app', source: 'app' }],
      },
      warnings: [],
    });
  });
});

describe('through the runner', () => {
  const packageRoot = path.resolve(import.meta.dirname, '..');
  const bin = path.join(packageRoot, 'bin/run.js');
  const run = promisify(execFile);
  let fixtures: string;
  let source: string;
  let deployment: string;

  const commandSource = (
    index: string,
  ): string => `import { Args, Flags } from '@oclif/core';
import { AppCommand } from ${index};

export default class SyncOrders extends AppCommand {
  static summary = 'Sync orders from the shop.';
  static args = { shop: Args.string({ description: 'The shop.' }) };
  static flags = { force: Flags.boolean({ description: 'Overwrite.' }) };
  async run() {
    await this.parse(SyncOrders);
    return { synced: true };
  }
}
`;
  const failingCommandSource = (
    index: string,
  ): string => `import { AppCommand, CommandError } from ${index};

export default class Fail extends AppCommand {
  static summary = 'Fail on purpose.';
  async run() {
    await this.parse(Fail);
    throw new CommandError('It failed.', {
      code: 'FIXTURE_FAILED',
      suggestions: ['Try again later.'],
      cause: new Error('the reason behind it'),
    });
  }
}
`;
  const pluginsSource = (
    index: string,
  ): string => `import { AppCommand, defineCliPlugin, defineCliPlugins } from ${index};

class Run extends AppCommand {
  static summary = 'Run the audit.';
  async run() { await this.parse(Run); }
}
class Build extends AppCommand {
  static summary = 'Build audit artifacts.';
  async run() { await this.parse(Build); }
}

export default defineCliPlugins([
  defineCliPlugin({
    packageName: '@acme/app-plugin-audit-log',
    commands: { run: Run },
    devCommands: { build: Build },
  }),
]);
`;

  /** An application at `dir`: a source checkout with TypeScript, or a built dist/ with JavaScript. */
  async function fixture(
    name: string,
    kind: 'source' | 'deployment',
  ): Promise<string> {
    const app = path.join(fixtures, name);
    await mkdir(path.join(app, 'cli', 'commands'), { recursive: true });
    await writeFile(
      path.join(app, 'package.json'),
      JSON.stringify({
        name,
        type: 'module',
        nocobase:
          kind === 'source'
            ? { templateKind: 'default' }
            : { buildTarget: { platform: process.platform } },
      }),
    );
    // A source application registers tsx from its own node_modules; both borrow this package's.
    await symlink(
      path.join(packageRoot, 'node_modules'),
      path.join(app, 'node_modules'),
    );
    const index = JSON.stringify(
      pathToFileURL(path.join(packageRoot, 'src', 'index.ts')).href,
    );
    const extension = kind === 'source' ? 'ts' : 'js';
    await writeFile(
      path.join(app, 'cli', 'commands', `sync-orders.${extension}`),
      commandSource(index),
    );
    await writeFile(
      path.join(app, 'cli', 'commands', `fail.${extension}`),
      failingCommandSource(index),
    );
    await writeFile(
      path.join(app, 'cli', `plugins.${extension}`),
      pluginsSource(index),
    );
    return app;
  }

  async function nocobase(
    app: string,
    argv: string[],
    env: NodeJS.ProcessEnv = {},
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    // A real deployment runs compiled packages. This one borrows the workspace sources, whose `.js` specifiers name
    // `.ts` files, and a deployment registers no loader for them, so the fixture preloads tsx itself.
    const node = app === deployment ? ['--import', 'tsx'] : [];
    try {
      const { stdout, stderr } = await run(
        process.execPath,
        [...node, bin, ...argv],
        {
          cwd: app,
          env: {
            ...process.env,
            NOCOBASE_CONTENT_TYPE: '',
            NOCOBASE_CLI_DEBUG: '',
            ...env,
          },
        },
      );
      return { stdout, stderr, code: 0 };
    } catch (error) {
      const failed = error as { stdout: string; stderr: string; code: number };
      return {
        stdout: failed.stdout,
        stderr: failed.stderr,
        code: failed.code,
      };
    }
  }

  beforeAll(async () => {
    fixtures = await mkdtemp(path.join(os.tmpdir(), 'command-catalog-e2e-'));
    source = await fixture('source-app', 'source');
    deployment = await fixture('deployment-app', 'deployment');
  }, 60_000);

  afterAll(async () => {
    await rm(fixtures, { recursive: true, force: true });
  });

  it('lists the whole tree of a source checkout', async () => {
    const result = await nocobase(source, ['commands', '--json']);
    expect(result.code).toBe(0);
    const document = JSON.parse(result.stdout) as {
      ok: boolean;
      result: CommandCatalog;
    };
    expect(document).toMatchObject({ ok: true, command: 'commands' });
    const byId = new Map(document.result.commands.map((c) => [c.id, c]));
    expect(byId.get('db apply')).toMatchObject({ source: 'builtin' });
    expect(byId.get('dev')).toMatchObject({ developmentOnly: true });
    expect(byId.get('app sync-orders')).toMatchObject({
      source: 'app',
      force: true,
      args: [{ name: 'shop', required: false }],
    });
    expect(byId.get('audit-log run')).toMatchObject({
      source: 'plugin',
      package: '@acme/app-plugin-audit-log',
      developmentOnly: false,
    });
    expect(byId.get('audit-log build')).toMatchObject({
      developmentOnly: true,
    });
  }, 60_000);

  it('lists no development command in a built dist/', async () => {
    const result = await nocobase(deployment, ['commands', '--json']);
    expect(result.code).toBe(0);
    const ids = (
      JSON.parse(result.stdout) as { result: CommandCatalog }
    ).result.commands.map((command) => command.id);
    expect(ids).toEqual(
      expect.arrayContaining(['db apply', 'app sync-orders', 'audit-log run']),
    );
    for (const id of ['dev', 'build', 'plugin register', 'audit-log build']) {
      expect(ids).not.toContain(id);
    }
  }, 60_000);

  it('suggests the command that was meant', async () => {
    const result = await nocobase(source, ['app', 'sync-order', '--json']);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_USAGE',
        message: 'Command "app sync-order" not found.',
        suggestions: [
          {
            message: 'Did you mean app sync-orders?',
            run: { command: 'pnpm', args: ['nocobase', 'app', 'sync-orders'] },
          },
          {
            message: 'List every command:',
            run: { command: 'pnpm', args: ['nocobase', 'commands', '--json'] },
          },
        ],
      },
    });
  }, 60_000);

  it('suggests the flag that was meant', async () => {
    const result = await nocobase(source, [
      'app',
      'sync-orders',
      '--forse',
      '--json',
    ]);
    expect(result.code).toBe(2);
    const document = JSON.parse(result.stdout) as {
      error: { message: string };
    };
    expect(document).toMatchObject({
      ok: false,
      command: 'app sync-orders',
      error: {
        code: 'INVALID_USAGE',
        message: 'Unknown flag --forse.',
        suggestions: [
          { message: 'Did you mean --force?' },
          {
            message: "See the command's flags:",
            run: {
              command: 'pnpm',
              args: ['nocobase', 'app', 'sync-orders', '--help'],
            },
          },
        ],
      },
    });
    expect(result.stdout).not.toContain('See more help with --help');
  }, 60_000);

  it('suggests node and the built entry in a deployment, which has no pnpm', async () => {
    const result = await nocobase(deployment, ['app', 'sync-order', '--json']);
    expect(result.code).toBe(2);
    // The runner reports the root it located, which is the working directory with symbolic links resolved.
    const entry = path.join(await realpath(deployment), 'cli', 'index.js');
    expect(JSON.parse(result.stdout)).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        suggestions: [
          {
            message: 'Did you mean app sync-orders?',
            run: { command: 'node', args: [entry, 'app', 'sync-orders'] },
          },
          {
            message: 'List every command:',
            run: { command: 'node', args: [entry, 'commands', '--json'] },
          },
        ],
      },
    });
  }, 60_000);

  it('prints the diagnostics behind a failure once, and still the suggestions', async () => {
    const result = await nocobase(source, ['app', 'fail'], {
      NOCOBASE_CLI_DEBUG: '1',
    });
    expect(result.code).toBe(1);
    expect(result.stderr.split('NOCOBASE_CLI_DEBUG:').length - 1).toBe(1);
    expect(result.stderr).toContain('the reason behind it');
    expect(result.stderr).toContain('It failed.');
    expect(result.stderr).toContain('Try again later.');
  }, 60_000);

  it('prints the suggestions for people', async () => {
    const result = await nocobase(source, ['app', 'sync-order']);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('Did you mean app sync-orders?');
    expect(result.stderr).toContain('pnpm nocobase commands --json');
  }, 60_000);
});
