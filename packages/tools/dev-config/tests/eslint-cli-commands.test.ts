import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createClientLibraryConfig,
  createApplicationConfig,
} from '../eslint/index.ts';

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'eslint-cli-commands-'));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const offending = `
export class Sync {
  async run() {
    const { resolveStandaloneAppRuntime } = await import('@nocobase/app-server/node');
    const rootDir = process.cwd();
    console.log(rootDir, resolveStandaloneAppRuntime);
    this.logJson({ ok: true });
    this.exit(1);
  }
}
`;

async function lint(
  configs: ReturnType<typeof createApplicationConfig>,
  file: string,
) {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: configs,
  });
  const [result] = await eslint.lintText(offending, {
    filePath: path.join(root, file),
  });
  return (result?.messages ?? []).map((message) => message.message);
}

describe('command rules', () => {
  it.each([
    [
      'an application command',
      createApplicationConfig({ tsconfigRootDir: root }),
      'cli/commands/sync.mjs',
    ],
    [
      'a plugin command',
      createClientLibraryConfig({ tsconfigRootDir: root }),
      'cli/sync.mjs',
    ],
  ])('tell %s what to use instead', async (_, configs, file) => {
    const messages = await lint(configs, file);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Use withApp() from AppCommand instead of creating the application yourself.',
        "'process.cwd' is restricted from being used. Use this.rootDir for application files, or an appPath() flag for paths the user passes.",
        'Use this.log for text and return the result from run(); console output bypasses --json.',
        'Return the result from run(); AppCommand prints the --json document.',
        'Return the result or throw CommandError instead of calling exit().',
      ]),
    );
  });

  it('leave code outside cli/ alone', async () => {
    const messages = await lint(
      createApplicationConfig({ tsconfigRootDir: root }),
      'server/sync.mjs',
    );
    expect(
      messages.filter((message) => message.includes('AppCommand')),
    ).toEqual([]);
  });
});
