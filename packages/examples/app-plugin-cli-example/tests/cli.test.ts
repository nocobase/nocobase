import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import cliPlugin from '../cli/index.ts';
import CliExampleArtifactBuild from '../cli/artifact-build.ts';
import CliExampleGreet from '../cli/greet.ts';
import packageMetadata from '../package.json' with { type: 'json' };

describe('cli plugin definition', () => {
  it('declares the package it belongs to', () => {
    expect(cliPlugin.packageName).toBe(packageMetadata.name);
  });

  it('claims a topic and describes it', () => {
    expect(cliPlugin.topic).toBe('cli-example');
    expect(cliPlugin.description).toBeTruthy();
  });

  it('maps sub-command names to their command classes', () => {
    expect(cliPlugin.commands).toEqual({ greet: CliExampleGreet });
    // It reads source directories, which a built `dist/` does not carry.
    expect(cliPlugin.devCommands).toEqual({
      'artifact:build': CliExampleArtifactBuild,
    });
  });

  it('exposes the cli entry the app imports', () => {
    expect(packageMetadata.exports['./cli']).toBeDefined();
    expect(packageMetadata.publishConfig.exports['./cli']).toBeDefined();
  });

  it('declares oclif as a peer so the app provides one copy', () => {
    expect(packageMetadata.peerDependencies['@oclif/core']).toBeTruthy();
    // Declared once. pnpm resolves the peer here on its own, so a duplicate devDependency would add nothing.
    expect(packageMetadata.devDependencies?.['@oclif/core']).toBeUndefined();
  });
});

describe('contributed commands', () => {
  const commands = Object.entries({
    ...cliPlugin.commands,
    ...cliPlugin.devCommands,
  });

  it('gives every command a summary and an example', () => {
    for (const [name, command] of commands) {
      expect(command.summary, `${name} has no summary`).toBeTruthy();
      expect(
        command.examples?.length,
        `${name} has no example`,
      ).toBeGreaterThan(0);
    }
  });

  it('describes every flag and argument', () => {
    for (const [name, command] of commands) {
      for (const [flag, definition] of Object.entries(command.flags ?? {})) {
        expect(
          definition.description ?? definition.summary,
          `${name} --${flag} has no description`,
        ).toBeTruthy();
      }
      for (const [argument, definition] of Object.entries(command.args ?? {})) {
        expect(
          definition.description,
          `${name} ${argument} has no description`,
        ).toBeTruthy();
      }
    }
  });
});

/**
 * Each command bound to a throwaway application, the way the runner points it at the one it located. The working
 * directory is moved elsewhere on purpose: a default path belongs to the application, not to where the command ran.
 */
describe('running the commands', () => {
  let root: string;
  let elsewhere: string;
  let Greet: typeof CliExampleGreet;
  let ArtifactBuild: typeof CliExampleArtifactBuild;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'cli-example-'));
    elsewhere = await mkdtemp(path.join(os.tmpdir(), 'cli-example-cwd-'));
    vi.spyOn(process, 'cwd').mockReturnValue(elsewhere);
    // `id` is what the runner would assign: the topic and the key the command is contributed under.
    Greet = bindAppCommand(CliExampleGreet, {
      id: 'cli-example:greet',
      rootDir: root,
    });
    ArtifactBuild = bindAppCommand(CliExampleArtifactBuild, {
      id: 'cli-example:artifact:build',
      rootDir: root,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(root, { recursive: true, force: true });
    await rm(elsewhere, { recursive: true, force: true });
  });

  it('prints the greeting for people and returns it', async () => {
    const run = await runAppCommand(Greet, ['world', '--loud']);

    expect(run.stdout).toBe('HELLO, WORLD!\n');
    expect(run.result).toEqual({ message: 'HELLO, WORLD!', target: 'world' });
  });

  it('prints the greeting as the --json result', async () => {
    const run = await runAppCommand(Greet, ['world', '--json']);

    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'cli-example greet',
      status: 'success',
      result: { message: 'Hello, world.', target: 'world' },
      warnings: [],
    });
  });

  it('resolves the default source root against the application, wherever it runs', async () => {
    const run = await runAppCommand(ArtifactBuild, []);

    expect(run.result).toEqual({
      sourceRoot: path.join(root, 'server/artifacts'),
      exists: false,
    });
  });

  it('reports a source root that exists', async () => {
    await mkdir(path.join(root, 'server/artifacts'), { recursive: true });

    const run = await runAppCommand(ArtifactBuild, []);

    expect(run.result).toEqual({
      sourceRoot: path.join(root, 'server/artifacts'),
      exists: true,
    });
  });

  it('resolves a typed source root from the current directory', async () => {
    const run = await runAppCommand(ArtifactBuild, [
      '--source-root',
      'sources',
    ]);

    expect(run.result).toMatchObject({
      sourceRoot: path.join(elsewhere, 'sources'),
    });
  });
});
