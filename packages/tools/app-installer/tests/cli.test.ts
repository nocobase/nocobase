import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };
import { runInstaller } from '../src/cli.ts';
import type { Pm2 } from '../src/lib/pm2.ts';

function capture(): { stream: Writable; text: () => string } {
  let buffer = '';
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      buffer += chunk.toString();
      callback();
    },
  });
  return { stream, text: () => buffer };
}

const noPm2: Pm2 = {
  version: async () => '7.0.0',
  start: async () => undefined,
  stop: async () => undefined,
  remove: async () => undefined,
  save: async () => undefined,
  describe: async () => undefined,
};

async function run(argv: string[], cwd?: string) {
  const stdout = capture();
  const stderr = capture();
  const code = await runInstaller({
    argv,
    version: packageMetadata.version,
    stdout: stdout.stream,
    stderr: stderr.stream,
    cwd,
    pm2: noPm2,
  });
  return { code, stdout: stdout.text(), stderr: stderr.text() };
}

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'app-installer-cli-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runInstaller', () => {
  it('prints help without a command, every example a command that runs as-is', async () => {
    const result = await run([]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('install DIRECTORY');
    const examples = result.stdout
      .split('\n')
      .filter((line) => line.trim().startsWith('$ '));
    expect(examples.length).toBeGreaterThan(1);
    for (const line of examples) {
      expect(line).toMatch(
        /\$ npx --yes --registry=\S+ @nocobase\/app-installer@\S+ /u,
      );
    }
  });

  it('prints help for a command given --help instead of rejecting the flag', async () => {
    for (const command of ['install', 'status']) {
      const result = await run([command, '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('install DIRECTORY');
    }
  });

  it('prints its version', async () => {
    const result = await run(['--version', '--json']);
    expect(JSON.parse(result.stdout)).toEqual({
      schemaVersion: 1,
      ok: true,
      command: '--version',
      status: 'success',
      result: { version: packageMetadata.version },
      warnings: [],
    });
  });

  it('answers an unknown command with exit code 2 and one JSON document', async () => {
    const result = await run(['upgrad', '--json']);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      command: 'upgrad',
      status: 'failure',
      error: { code: 'INVALID_USAGE' },
    });
  });

  it('requires the install directory', async () => {
    const result = await run(['install', '--json']);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.message).toContain('directory');
  });

  it('rejects an origin with a path before touching anything', async () => {
    const target = path.join(dir, 'hub');
    const result = await run([
      'install',
      target,
      '--origin',
      'https://apps.example.com/hub',
      '--json',
    ]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.code).toBe('INVALID_USAGE');
  });

  it('refuses a target that already holds files', async () => {
    await writeFile(path.join(dir, 'keep.txt'), 'mine');
    const result = await run(['install', dir, '--template', 'hub', '--json']);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.code).toBe('TARGET_NOT_EMPTY');
  });

  it('takes the install directory from --dir, as the other commands do', async () => {
    await writeFile(path.join(dir, 'keep.txt'), 'mine');
    const result = await run([
      'install',
      '--dir',
      dir,
      '--template',
      'hub',
      '--json',
    ]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.code).toBe('TARGET_NOT_EMPTY');
  });

  it('refuses a directory argument and a --dir that disagree', async () => {
    const result = await run([
      'install',
      path.join(dir, 'a'),
      '--dir',
      path.join(dir, 'b'),
      '--json',
    ]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.code).toBe('INVALID_USAGE');
  });

  it('suggests commands that run as-is, through npx with the registry named', async () => {
    const result = await run(['frobnicate', '--json']);
    const [suggestion] = JSON.parse(result.stdout).error.suggestions as {
      run: unknown;
    }[];
    expect(suggestion.run).toEqual({
      command: 'npx',
      args: [
        '--yes',
        expect.stringMatching(/^--registry=\S+$/u),
        `@nocobase/app-installer@${packageMetadata.version}`,
        '--help',
      ],
    });
  });

  it('rejects a malformed --set before touching anything', async () => {
    const result = await run([
      'install',
      path.join(dir, 'hub'),
      '--template',
      'hub',
      '--set',
      'novalue',
      '--json',
    ]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.message).toContain(
      '--set expects key=value',
    );
  });

  it('asks for exactly one thing to install', async () => {
    const target = path.join(dir, 'crm');
    const none = await run(['install', target, '--json']);
    expect(none.code).toBe(2);
    expect(JSON.parse(none.stdout).error.message).toContain('--archive');
    const both = await run([
      'install',
      target,
      '--template',
      'hub',
      '--archive',
      'crm.tar.gz',
      '--json',
    ]);
    expect(both.code).toBe(2);
    expect(JSON.parse(both.stdout).error.code).toBe('INVALID_USAGE');
  });

  it('builds only the Hub template, and says how to install an application of its own', async () => {
    const result = await run([
      'install',
      path.join(dir, 'app'),
      '--template',
      'default',
      '--json',
    ]);
    expect(result.code).toBe(2);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('INVALID_USAGE');
    expect(error.suggestions[0].message).toContain('--archive');
  });

  it('takes an archive by local path only, and names one that is not there', async () => {
    const remote = await run([
      'install',
      path.join(dir, 'crm'),
      '--archive',
      'https://example.com/crm.tar.gz',
      '--json',
    ]);
    expect(JSON.parse(remote.stdout).error).toMatchObject({
      code: 'INVALID_USAGE',
    });
    const missing = await run([
      'install',
      path.join(dir, 'crm'),
      '--archive',
      path.join(dir, 'missing.tar.gz'),
      '--json',
    ]);
    expect(missing.code).toBe(2);
    expect(JSON.parse(missing.stdout).error.code).toBe('ARCHIVE_NOT_FOUND');
  });

  it('reports status for a root it does not manage as not installed', async () => {
    const result = await run(['status', '--dir', dir, '--json']);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error.code).toBe('NOT_INSTALLED');
  });

  it('keeps stdout to the JSON document and writes progress to stderr', async () => {
    const result = await run(['status', '--dir', dir]);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Error:');
  });
});
