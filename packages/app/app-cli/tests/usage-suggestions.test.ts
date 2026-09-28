// @vitest-environment node
// What an invalid command line answers with: a message naming only what the command declares, never a value that was
// typed, the flag or command that was probably meant, and where to look next — under --json as `error.suggestions`,
// and for people under "Try this:".
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Args, Errors, Flags } from '@oclif/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppCommand, CommandError } from '../src/index.ts';
import {
  closestCommandIds,
  describeUnknownCommand,
} from '../src/command/usage.ts';
import { setApplicationState } from '../src/runtime/command-store.ts';
import { bindAppCommand, runAppCommand } from '../src/testing.ts';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'usage-suggestions-'));
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', nocobase: { templateKind: 'default' } }),
  );
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

class Apply extends AppCommand {
  static override flags = {
    connection: Flags.string({ description: 'The connection.' }),
    all: Flags.boolean({ description: 'Every connection.' }),
    'dry-run': Flags.boolean({ description: 'Preview only.' }),
    collections: Flags.boolean({
      description: 'Refresh the cache.',
      allowNo: true,
      default: true,
    }),
    port: Flags.integer({ description: 'A port.' }),
    name: Flags.string({ description: 'A name.', required: true }),
    dialect: Flags.string({
      description: 'A dialect.',
      options: ['sqlite', 'postgres'],
    }),
    only: Flags.string({ description: 'One.', exclusive: ['every'] }),
    every: Flags.boolean({ description: 'All.', exclusive: ['only'] }),
    solo: Flags.boolean({ description: 'Alone.', combinable: ['name'] }),
    needs: Flags.string({ description: 'Needs.', dependsOn: ['port'] }),
  };
  public async run(): Promise<{ ok: true }> {
    await this.parse(Apply);
    return { ok: true };
  }
}

class Register extends AppCommand {
  static override args = {
    name: Args.string({ description: 'The plugin.', required: true }),
  };
  public async run(): Promise<{ ok: true }> {
    await this.parse(Register);
    return { ok: true };
  }
}

function bound<T extends typeof AppCommand>(command: T, id: string): T {
  return bindAppCommand(command, { rootDir: root, id });
}

const helpSuggestion = (words: string[], label = 'flags') => ({
  message: `See the command's ${label}:`,
  run: { command: 'pnpm', args: ['nocobase', ...words, '--help'] },
});

describe('a flag that does not exist', () => {
  it("suggests the flag that was meant, drops oclif's hint, and exits 2", async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--conection',
      'main',
    ]);
    expect(run.exitCode).toBe(2);
    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: false,
      command: 'db apply',
      status: 'failure',
      error: {
        code: 'INVALID_USAGE',
        message: 'Unknown flag --conection.',
        suggestions: [
          { message: 'Did you mean --connection?' },
          helpSuggestion(['db', 'apply']),
        ],
      },
      warnings: [],
    });
    expect(run.stdout).not.toContain('See more help with --help');
  });

  it('reads a flag given with its value, and finds a negated boolean', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name=x',
      '--no-colections',
      '--dry-rn=1',
    ]);
    expect(run.json()).toMatchObject({
      error: {
        suggestions: [
          { message: 'Did you mean --no-collections?' },
          { message: 'Did you mean --dry-run?' },
          helpSuggestion(['db', 'apply']),
        ],
      },
    });
  });

  it('suggests only where to look when nothing is close', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--database',
    ]);
    expect(run.json()).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        suggestions: [helpSuggestion(['db', 'apply'])],
      },
    });
  });

  it('prints the suggestions for people through oclif', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--name',
      'x',
      '--conection',
      'main',
    ]);
    expect(run.error).toBeInstanceOf(CommandError);
    expect(run.error).toMatchObject({
      message: 'Unknown flag --conection.',
      oclif: { exit: 2 },
      suggestions: [
        'Did you mean --connection?',
        "See the command's flags: pnpm nocobase db apply --help",
      ],
    });
    expect(run.exitCode).toBe(2);
  });
});

describe('other invalid usage', () => {
  it('reports a missing required flag without the hint', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), ['--json']);
    expect(run.exitCode).toBe(2);
    const document = run.json();
    expect(document).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_USAGE',
        message: 'Missing required flag --name.',
        suggestions: [helpSuggestion(['db', 'apply'])],
      },
    });
    expect(JSON.stringify(document)).not.toContain('See more help');
  });

  it('points a missing argument at the arguments', async () => {
    const run = await runAppCommand(bound(Register, 'plugin:register'), [
      '--json',
    ]);
    expect(run.exitCode).toBe(2);
    expect(run.json()).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        message: 'Missing required argument <name>.',
        suggestions: [helpSuggestion(['plugin', 'register'], 'arguments')],
      },
    });
  });

  it('treats a flag value its parser rejects as invalid usage', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--port',
      'eighty',
    ]);
    expect(run.exitCode).toBe(2);
    expect(run.json()).toMatchObject({
      error: { code: 'INVALID_USAGE', message: 'Invalid value for --port.' },
    });
    expect(run.stdout).not.toContain('eighty');
  });

  it('never repeats a value that was typed, wherever it landed', async () => {
    const secret = 'typed-secret-value';
    for (const argv of [
      [`--tokn=${secret}`],
      ['--tokn', secret],
      ['--port', secret],
      ['--dialect', secret],
      ['--only', secret, '--every'],
    ]) {
      const run = await runAppCommand(bound(Apply, 'db:apply'), [
        '--json',
        '--name',
        'x',
        ...argv,
      ]);
      expect(run.exitCode).toBe(2);
      expect(run.json()).toMatchObject({ error: { code: 'INVALID_USAGE' } });
      expect(run.stdout + run.stderr).not.toContain(secret);
    }
    const unexpected = await runAppCommand(bound(Register, 'plugin:register'), [
      '--json',
      'audit-log',
      secret,
    ]);
    expect(unexpected.json()).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        message: 'Too many arguments; this command takes <name>.',
      },
    });
    expect(unexpected.stdout).not.toContain(secret);
  });

  it('lists the values an option flag accepts', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--dialect',
      'oracle',
    ]);
    expect(run.json()).toMatchObject({
      error: {
        message:
          'Invalid value for --dialect; expected one of: sqlite, postgres.',
      },
    });
  });

  it('names both sides of flags that exclude each other, once', async () => {
    const run = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--only',
      'a',
      '--every',
    ]);
    expect(run.json()).toMatchObject({
      error: { message: '--every cannot be combined with --only.' },
    });
  });

  it('repeats the reasons oclif gives for dependsOn and combinable, which name only flags', async () => {
    const depends = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--needs',
      'typed-value',
    ]);
    expect(depends.json()).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        message:
          'All of the following must be provided when using --needs: --port.',
      },
    });
    expect(depends.stdout).not.toContain('typed-value');

    const combinable = await runAppCommand(bound(Apply, 'db:apply'), [
      '--json',
      '--name',
      'x',
      '--solo',
      '--all',
    ]);
    expect(combinable.json()).toMatchObject({
      error: {
        code: 'INVALID_USAGE',
        message: expect.stringMatching(
          /^Only the following can be provided when using --solo: .*--name/u,
        ),
      },
    });
  });

  it('points help at node and the built entry in a deployment', async () => {
    setApplicationState({
      location: {
        kind: 'deployment',
        root: '/srv/app/dist',
      },
      loadPlugins: async () => undefined,
    });
    try {
      const run = await runAppCommand(bound(Apply, 'db:apply'), [
        '--json',
        '--nme',
        'x',
      ]);
      expect(run.json()).toMatchObject({
        error: {
          suggestions: [
            { message: 'Did you mean --name?' },
            {
              message: "See the command's flags:",
              run: {
                command: 'node',
                args: [
                  path.join('/srv/app/dist', 'cli', 'index.js'),
                  'db',
                  'apply',
                  '--help',
                ],
              },
            },
          ],
        },
      });
    } finally {
      setApplicationState(undefined);
    }
  });

  it('leaves a failure inside run() alone, and does not call it invalid usage', async () => {
    class Fails extends AppCommand {
      public async run(): Promise<never> {
        await this.parse(Fails);
        throw new Errors.CLIError('Something else went wrong.', { exit: 1 });
      }
    }
    const run = await runAppCommand(bound(Fails, 'fixture:fails'), ['--json']);
    expect(run.exitCode).toBe(1);
    expect(run.json()).toMatchObject({
      error: {
        code: 'COMMAND_FAILED',
        message: 'Something else went wrong.',
        suggestions: [],
      },
    });
  });
});

describe('an unknown command', () => {
  const tree = {
    commandIds: [
      'db:apply',
      'db:redo',
      'db:reset',
      'dev',
      'plugin:register',
      'app:sync-orders',
      'commands',
    ],
    topics: ['db', 'plugin', 'app'],
  };
  const listEverything = {
    message: 'List every command:',
    run: { command: 'pnpm', args: ['nocobase', 'commands', '--json'] },
  };

  it('suggests the closest command ids and the catalog', () => {
    const failure = describeUnknownCommand(
      new Errors.CLIError('command db:aply not found'),
      tree,
    );
    expect(failure).toEqual({
      message: 'Command "db aply" not found.',
      exit: 2,
      suggestions: [
        {
          message: 'Did you mean db apply?',
          run: { command: 'pnpm', args: ['nocobase', 'db', 'apply'] },
        },
        listEverything,
      ],
    });
  });

  it('points at the topic when the first word is one and nothing is close', () => {
    const failure = describeUnknownCommand(
      new Errors.CLIError('command db:migrate not found'),
      tree,
    );
    expect(failure?.suggestions).toEqual([
      {
        message: 'See the db commands:',
        run: { command: 'pnpm', args: ['nocobase', 'db', '--help'] },
      },
      listEverything,
    ]);
  });

  it('suggests the topic a single misspelled word was meant to be', () => {
    const failure = describeUnknownCommand(
      new Errors.CLIError('command plugn not found'),
      tree,
    );
    expect(failure?.suggestions).toEqual([
      {
        message: 'Did you mean plugin? See its commands:',
        run: { command: 'pnpm', args: ['nocobase', 'plugin', '--help'] },
      },
      listEverything,
    ]);
  });

  it('ignores any other error', () => {
    expect(
      describeUnknownCommand(new Error('Could not connect'), tree),
    ).toBeUndefined();
  });

  it('finds a command when oclif folded positional arguments into the id', () => {
    expect(
      closestCommandIds(['plugn', 'register', 'audit-log'], tree.commandIds),
    ).toEqual(['plugin:register']);
    expect(closestCommandIds(['app', 'sync-order'], tree.commandIds)).toEqual([
      'app:sync-orders',
    ]);
    expect(closestCommandIds(['dbb', 'aply'], tree.commandIds)).toEqual([
      'db:apply',
    ]);
    expect(closestCommandIds(['migrate'], tree.commandIds)).toEqual([]);
  });
});
