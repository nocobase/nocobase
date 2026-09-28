import type { Config } from '@oclif/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestConfig, runCommand } from './helpers.ts';

/**
 * The command surface this package exposes, asserted exactly so adding or renaming a command is a deliberate edit here
 * rather than something that drifts in unnoticed. Commands are found by directory, so a file dropped under
 * `src/commands/` shows up here before it ships.
 */
const EXPECTED_IDS = [
  'build',
  'collections:doctor',
  'collections:generate',
  'commands',
  'config:check',
  'config:env',
  'config:init',
  'config:set',
  'db:apply',
  'db:redo',
  'db:repair',
  'db:reset',
  'db:rollback',
  'db:unlock',
  'dev',
  'dist:check',
  'dist:retarget',
  'info',
  'locales:check',
  'package:remove',
  'plugin:inspect',
  'plugin:register',
  'plugin:unregister',
  'plugin:update',
  'skills:sync',
  'start',
];

/** The commands that manage an application's packages, and take the application from a flag. */
const PACKAGE_COMMAND_IDS = [
  'package:remove',
  'plugin:inspect',
  'plugin:register',
  'plugin:unregister',
  'plugin:update',
  'skills:sync',
];

let config: Config;

beforeAll(async () => {
  config = await loadTestConfig();
});

describe('command tree', () => {
  it('exposes exactly the documented commands', () => {
    expect([...config.commandIDs].sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it('groups commands under the package, plugin, and skills topics', () => {
    expect(config.topics.map((topic) => topic.name)).toContain('package');
    expect(config.topics.map((topic) => topic.name)).toContain('plugin');
    expect(config.topics.map((topic) => topic.name)).toContain('skills');
  });

  it('gives every command a summary so help output is never blank', () => {
    for (const id of config.commandIDs) {
      const command = config.findCommand(id, { must: true });
      expect(command.summary, `${id} has no summary`).toBeTruthy();
    }
  });

  it('gives every package command at least one example', () => {
    for (const id of PACKAGE_COMMAND_IDS) {
      const command = config.findCommand(id, { must: true });
      expect(command.examples?.length, `${id} has no examples`).toBeGreaterThan(
        0,
      );
    }
  });

  it('describes every flag and argument', () => {
    for (const id of config.commandIDs) {
      const command = config.findCommand(id, { must: true });

      for (const [name, flag] of Object.entries(command.flags ?? {})) {
        expect(
          flag.description ?? flag.summary,
          `${id} --${name} has no description`,
        ).toBeTruthy();
      }

      for (const [name, arg] of Object.entries(command.args ?? {})) {
        expect(
          arg.description,
          `${id} ${name} has no description`,
        ).toBeTruthy();
      }
    }
  });
});

describe('documented argument contract', () => {
  /**
   * `--dir` and `--json` are the two flags the package management commands share: each one has to find the application
   * it acts on, and each may be driven by an agent that needs machine-readable output. A command that quietly drops
   * either flag breaks that shared contract.
   */
  it.each(PACKAGE_COMMAND_IDS)('%s accepts the shared flags', (id) => {
    const flags = Object.keys(
      config.findCommand(id, { must: true }).flags ?? {},
    );

    expect(flags).toContain('dir');
    expect(flags).toContain('json');
  });

  /**
   * `--workspace-root` targets an application inside this monorepo rather than a generated one, which is what the
   * repository root passes as `pnpm nocobase plugin register --workspace-root .`. `update` is the exception: it upgrades an installed package, and
   * a workspace application's plugins are linked from source rather than installed.
   */
  it.each([
    'package:remove',
    'plugin:inspect',
    'plugin:register',
    'plugin:unregister',
    'skills:sync',
  ])('%s can target a workspace application', (id) => {
    expect(
      Object.keys(config.findCommand(id, { must: true }).flags ?? {}),
    ).toContain('workspace-root');
  });

  it('names the plugin as an argument where one must be chosen', () => {
    for (const id of [
      'package:remove',
      'plugin:inspect',
      'plugin:register',
      'plugin:unregister',
    ]) {
      const command = config.findCommand(id, { must: true });
      expect(command.args?.name?.required, `${id} should require a name`).toBe(
        true,
      );
    }
  });
});

describe('argument errors', () => {
  it('rejects a missing required argument', async () => {
    await expect(
      runCommand(config, 'plugin:register', []),
    ).rejects.toMatchObject({
      oclif: { exit: 2 },
    });
  });

  it('rejects an unknown flag', async () => {
    await expect(
      runCommand(config, 'plugin:inspect', ['--nonexistent']),
    ).rejects.toMatchObject({
      oclif: { exit: 2 },
    });
  });
});
