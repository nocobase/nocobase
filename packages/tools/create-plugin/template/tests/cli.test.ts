import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { describe, expect, it } from 'vitest';

import cliPlugin from '../cli/index.ts';
import PluginInfo from '../cli/info.ts';
import packageMetadata from '../package.json' with { type: 'json' };

/**
 * The command pinned to an application the way the runner pins it to the one it located, under the id it answers to.
 * `info` reads nothing from the application, so any directory serves as its root. A command that reads files there
 * needs a throwaway root the test writes them into, from `mkdtemp()`.
 */
const Info = bindAppCommand(PluginInfo, {
  id: `${cliPlugin.topic}:info`,
  rootDir: import.meta.dirname,
});

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('contributes its commands under the package topic', () => {
    expect(cliPlugin.packageName).toBe(packageMetadata.name);
    expect(cliPlugin.commands).toEqual({ info: PluginInfo });
  });

  it('returns the plugin name and version as its result', async () => {
    const run = await runAppCommand(Info, []);

    expect(run.result).toEqual({
      name: packageMetadata.name,
      version: packageMetadata.version,
    });
  });

  // A command that fails throws CommandError; its test asserts the `error.code` in `run.json()` and `run.exitCode`.
  it('prints its result as the --json document', async () => {
    const run = await runAppCommand(Info, ['--json']);

    expect(run.json()).toMatchObject({
      ok: true,
      command: `${cliPlugin.topic} info`,
      result: { name: packageMetadata.name, version: packageMetadata.version },
    });
    expect(run.exitCode).toBeUndefined();
  });
});
