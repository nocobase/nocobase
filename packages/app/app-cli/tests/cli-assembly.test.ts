import { readdirSync } from 'node:fs';
import path from 'node:path';

import { Command } from '@oclif/core';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  defineCliPlugin,
  defineCliPlugins,
  pluginTopicFor,
} from '../src/plugins/index.ts';
import type { AppCliCommand } from '../src/plugins/types.ts';
import { assembleCli } from '../src/runtime/assemble.ts';
import {
  RESERVED_TOPICS,
  builtinCommandFiles,
  builtinTopicsFor,
  loadBuiltinCommands,
} from '../src/runtime/builtin.ts';
import { matchCommandId } from '../src/runtime/run.ts';

class Fake extends Command {
  public async run(): Promise<void> {}
}

function plugin(name: string) {
  return defineCliPlugin({
    packageName: `@nocobase/app-plugin-${name}`,
    commands: { go: Fake },
  });
}

let builtinCommands: Record<string, AppCliCommand>;

beforeAll(async () => {
  builtinCommands = await loadBuiltinCommands({ kind: 'source' });
});

function assemble(...plugins: ReturnType<typeof plugin>[]) {
  return assembleCli({
    builtinCommands,
    builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
    plugins: defineCliPlugins(plugins),
    reservedTopics: RESERVED_TOPICS,
  });
}

describe('built-in commands by location', () => {
  it('registers development commands only in a source checkout', async () => {
    const source = Object.keys(await builtinCommandFiles({ kind: 'source' }));
    const deployment = Object.keys(
      await builtinCommandFiles({ kind: 'deployment' }),
    );

    expect(source).toEqual(expect.arrayContaining(['dev', 'build', 'start']));
    expect(source).toContain('plugin:register');
    expect(deployment).toEqual(
      expect.arrayContaining(['info', 'db:apply', 'config:init']),
    );
    for (const id of deployment) {
      expect(id).not.toMatch(
        /^(build|dev|dist|start|plugin|package|skills)(:|$)/,
      );
    }
  });

  it('registers only flag-targeted commands and the catalog outside an application', async () => {
    const none = Object.keys(
      await builtinCommandFiles({ kind: 'none' }),
    ).sort();

    expect(none).toEqual([
      'commands',
      'package:remove',
      'plugin:inspect',
      'plugin:register',
      'plugin:unregister',
      'plugin:update',
      'skills:sync',
    ]);
  });

  it('carries no Hub commands of its own, which @nocobase/hub-cli contributes', async () => {
    for (const kind of ['source', 'deployment', 'none'] as const) {
      for (const id of Object.keys(await builtinCommandFiles({ kind }))) {
        expect(id).not.toMatch(/^(hub|release)(:|$)/);
      }
    }
  });

  it('lists a topic only when one of its commands is registered', () => {
    expect(Object.keys(builtinTopicsFor(['info', 'db:apply']))).toEqual(['db']);
  });
});

describe('dispatching a built-in command', () => {
  const ids = ['db:apply', 'plugin:register', 'build', 'dist:check'];

  it('matches the longest run of leading words', () => {
    expect(matchCommandId(['db', 'apply', '--all'], ids)).toBe('db:apply');
    expect(matchCommandId(['build', '--target', 'linux-x64'], ids)).toBe(
      'build',
    );
    expect(matchCommandId(['dist', 'check'], ids)).toBe('dist:check');
  });

  it('matches nothing for a topic, help, or a command it does not own', () => {
    expect(matchCommandId(['db'], ids)).toBeUndefined();
    expect(matchCommandId([], ids)).toBeUndefined();
    expect(matchCommandId(['--help'], ids)).toBeUndefined();
    expect(matchCommandId(['workflow', 'build'], ids)).toBeUndefined();
  });
});

describe('assembly', () => {
  it('mounts app commands under the app topic', () => {
    const { commands, topics } = assembleCli({
      builtinCommands,
      builtinTopics: {},
      commands: { 'sync-orders': Fake },
    });
    expect(commands['app:sync-orders']).toBe(Fake);
    expect(topics.app).toBeDefined();
  });

  it('leaves the app topic out when the app contributes nothing', () => {
    const { topics } = assembleCli({ builtinCommands, builtinTopics: {} });
    expect(topics.app).toBeUndefined();
  });

  it('mounts plugin commands under the topic its package name gives', () => {
    const { commands, topics } = assemble(plugin('audit-log'));
    expect(commands['audit-log:go']).toBe(Fake);
    expect(topics['audit-log']?.description).toContain(
      '@nocobase/app-plugin-audit-log',
    );
  });

  it('nests a colon-separated command name one level deeper', () => {
    const { commands } = assemble(
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-audit-log',
        commands: { 'artifact:build': Fake },
      }),
    );
    expect(commands['audit-log:artifact:build']).toBe(Fake);
  });

  it('leaves development commands out of a deployment', () => {
    const contributed = defineCliPlugins([
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-audit-log',
        commands: { run: Fake },
        devCommands: { build: Fake },
      }),
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-source-only',
        devCommands: { check: Fake },
      }),
    ]);
    const source = assembleCli({
      builtinCommands: {},
      builtinTopics: {},
      plugins: contributed,
    });
    const deployment = assembleCli({
      builtinCommands: {},
      builtinTopics: {},
      plugins: contributed,
      deployment: true,
    });

    expect(Object.keys(source.commands).sort()).toEqual([
      'audit-log:build',
      'audit-log:run',
      'source-only:check',
    ]);
    expect(Object.keys(deployment.commands)).toEqual(['audit-log:run']);
    expect(deployment.topics['source-only']).toBeUndefined();
  });
});

describe('topic collisions', () => {
  it('rejects a plugin taking a built-in topic or top-level command', () => {
    for (const name of [
      'plugin',
      'package',
      'skills',
      'db',
      'build',
      'info',
      'commands',
    ]) {
      expect(() => assemble(plugin(name))).toThrow(/built-in/);
    }
  });

  it('reserves built-in names even where their commands are not registered', () => {
    expect(() =>
      assembleCli({
        builtinCommands: {},
        builtinTopics: {},
        plugins: defineCliPlugins([plugin('start')]),
        reservedTopics: RESERVED_TOPICS,
      }),
    ).toThrow(/built-in/);
  });

  it('lets a CLI package claim its topic without importing it', () => {
    const assembled = assembleCli({
      builtinCommands,
      builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
      reservedTopics: RESERVED_TOPICS,
      claimedTopics: { hub: '@nocobase/hub-cli' },
    });
    // Claimed, not registered: the topic has no commands in this run.
    expect(assembled.topics).not.toHaveProperty('hub');
    expect(() =>
      assembleCli({
        builtinCommands,
        builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
        plugins: defineCliPlugins([plugin('hub')]),
        reservedTopics: RESERVED_TOPICS,
        claimedTopics: { hub: '@nocobase/hub-cli' },
      }),
    ).toThrow(
      /@nocobase\/app-plugin-hub.*@nocobase\/hub-cli|@nocobase\/hub-cli.*@nocobase\/app-plugin-hub/,
    );
  });

  it('rejects a CLI package claiming a built-in topic', () => {
    expect(() =>
      assembleCli({
        builtinCommands,
        builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
        reservedTopics: RESERVED_TOPICS,
        claimedTopics: { plugin: '@acme/plugin-cli' },
      }),
    ).toThrow(/built-in/);
  });

  it('rejects a plugin claiming the app topic', () => {
    expect(() => assemble(plugin('app'))).toThrow(/built-in|this app/);
  });

  it('keeps the built-in names clear of every plugin in this repository', () => {
    const packagesRoot = path.resolve(import.meta.dirname, '..', '..', '..');
    const names = ['plugins', 'examples'].flatMap((directory) =>
      readdirSync(path.join(packagesRoot, directory))
        .filter((name) => name.startsWith('app-plugin-'))
        .map((name) => pluginTopicFor(`@nocobase/${name}`)),
    );

    expect(names).toEqual(expect.arrayContaining(['hub', 'i18n', 'workflow']));
    expect(names.filter((name) => RESERVED_TOPICS.includes(name))).toEqual([]);
  });
});

describe('definition validation', () => {
  it('derives the topic from the package name', () => {
    expect(pluginTopicFor('@nocobase/app-plugin-workflow')).toBe('workflow');
    expect(pluginTopicFor('@acme/app-plugin-audit-log')).toBe('audit-log');
    expect(pluginTopicFor('@acme/reports')).toBe('reports');
  });

  it('drops a -cli suffix from a package that is not an application plugin', () => {
    expect(pluginTopicFor('@nocobase/hub-cli')).toBe('hub');
    expect(pluginTopicFor('@acme/audit-log-cli')).toBe('audit-log');
    // An application plugin keeps its whole name after the prefix, suffix included.
    expect(pluginTopicFor('@acme/app-plugin-audit-cli')).toBe('audit-cli');
    expect(pluginTopicFor('@nocobase/app-plugin-cli-example')).toBe(
      'cli-example',
    );
  });

  it('rejects a declared topic that is not the derived one', () => {
    expect(() =>
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-scheduler',
        topic: 'schedule',
        commands: { sync: Fake },
      }),
    ).toThrow(/"scheduler"/);
  });

  it('accepts a declared topic that matches', () => {
    expect(
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-scheduler',
        topic: 'scheduler',
        commands: { sync: Fake },
      }).topic,
    ).toBe('scheduler');
  });

  it('rejects a command declared in both commands and devCommands', () => {
    expect(() =>
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-a',
        commands: { go: Fake },
        devCommands: { go: Fake },
      }),
    ).toThrow(/both commands and devCommands/);
  });

  it('rejects the same plugin registered twice', () => {
    expect(() => defineCliPlugins([plugin('a'), plugin('a')])).toThrow(
      /registered more than once/,
    );
  });

  it('rejects a command that is not an oclif Command', () => {
    expect(() =>
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-a',
        commands: { go: {} as typeof Command },
      }),
    ).toThrow(/not an oclif Command/);
  });

  it('warns about a plugin declaring neither commands nor hooks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      defineCliPlugin({
        packageName: '@nocobase/app-plugin-a',
        commands: {},
      }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/neither commands nor hooks/),
    );

    warn.mockRestore();
  });

  it('accepts a plugin contributing hooks alone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const build = defineCliPlugin({
      packageName: '@nocobase/app-plugin-a',
      buildHooks: { beforeBuild: [{ command: ['node', '-e', ''] }] },
    });
    const dev = defineCliPlugin({
      packageName: '@nocobase/app-plugin-b',
      devHooks: { beforeDev: [{ command: ['node', '-e', ''] }] },
    });

    expect(build.commands).toEqual({});
    expect(dev.commands).toEqual({});
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
