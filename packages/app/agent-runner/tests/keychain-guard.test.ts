// The keychain guards keep an agent away from the run CLI's keychain items and let every other call through.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { writeKeychainGuards } from '../src/agent/keychain-guard.ts';
import { removeDir, tempDir } from './helpers.ts';

describe('keychain guards', () => {
  let root = '';
  afterEach(() => removeDir(root));

  /** A host whose `security` and `secret-tool` print what they were called with, and a guard for `acme-cli`. */
  async function setup(): Promise<{ binDir: string; guarded: string[] }> {
    root = tempDir('runner-keychain-');
    const realDir = path.join(root, 'usr-bin');
    mkdirSync(realDir);
    for (const tool of ['security', 'secret-tool']) {
      const file = path.join(realDir, tool);
      writeFileSync(file, `#!/bin/sh\necho "real ${tool} $*"\n`);
      chmodSync(file, 0o755);
    }
    const binDir = path.join(root, 'bin');
    const guarded = await writeKeychainGuards(
      binDir,
      'acme-cli',
      'acme',
      `${binDir}${path.delimiter}${realDir}`,
    );
    return { binDir, guarded };
  }

  function call(binDir: string, tool: string, args: string[]) {
    const result = spawnSync(path.join(binDir, tool), args, {
      encoding: 'utf8',
    });
    return {
      code: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  it('guards both tools when the host has them', async () => {
    const { binDir, guarded } = await setup();
    expect(guarded).toEqual(['security', 'secret-tool']);
    expect(existsSync(path.join(binDir, 'security'))).toBe(true);
  });

  it("lets the coding tools read their own items, and refuses the CLI's", async () => {
    const { binDir } = await setup();
    const claude = call(binDir, 'security', [
      'find-generic-password',
      '-s',
      'Claude Code-credentials',
      '-a',
      'me',
      '-w',
    ]);
    expect(claude.code).toBe(0);
    expect(claude.stdout).toContain('real security find-generic-password');

    for (const args of [
      ['find-generic-password', '-s', 'acme-cli', '-w'],
      ['find-generic-password', '-sacme-cli', '-w'],
      ['find-generic-password', '-a', '/home/a/.acme', '-w'],
      ['add-generic-password', '-U', '-s', 'acme-cli', '-a', 'x', '-w', 'y'],
      ['delete-generic-password', '-s', 'acme-cli'],
      ['dump-keychain'],
      ['-i'],
      ['-v', 'export'],
    ]) {
      const refused = call(binDir, 'security', args);
      expect({ args, code: refused.code }).toEqual({ args, code: 1 });
      expect(refused.stdout).toBe('');
      expect(refused.stderr).toContain(
        'agent runs cannot use the acme-cli keychain items',
      );
    }
    expect(call(binDir, 'security', ['list-keychains']).code).toBe(0);
  });

  it('does the same for secret-tool', async () => {
    const { binDir } = await setup();
    expect(
      call(binDir, 'secret-tool', ['lookup', 'service', 'gh', 'user', 'me'])
        .code,
    ).toBe(0);
    for (const args of [
      ['lookup', 'service', 'acme-cli', 'account', 'x'],
      ['lookup', 'account', 'x'],
      ['clear', 'service', 'acme-cli', 'account', 'x'],
      ['search', '--all', 'service', 'gh'],
    ])
      expect({ args, code: call(binDir, 'secret-tool', args).code }).toEqual({
        args,
        code: 1,
      });
  });

  it('writes no guard for a tool the host lacks', async () => {
    root = tempDir('runner-keychain-');
    expect(
      await writeKeychainGuards(
        path.join(root, 'bin'),
        'acme-cli',
        'acme',
        root,
      ),
    ).toEqual([]);
  });
});
