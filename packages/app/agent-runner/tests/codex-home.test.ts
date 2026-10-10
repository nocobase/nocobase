import { mkdir, mkdtemp, readlink, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prepareCodexHome } from '../src/agent/codex-home.ts';
import { buildAgentEnv, forbidden } from '../src/agent/env.ts';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-codex-home-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("Codex's home", () => {
  it("is the workspace's own, linking the real login and settings", async () => {
    const real = path.join(root, 'real-codex');
    await mkdir(real);
    await writeFile(path.join(real, 'auth.json'), '{}');
    await writeFile(path.join(real, 'config.toml'), '');
    await writeFile(path.join(real, 'history.jsonl'), '');
    const a = await prepareCodexHome(path.join(root, 'a', 'codex-home'), real);
    const b = await prepareCodexHome(path.join(root, 'b', 'codex-home'), real);
    expect(a).not.toBe(b);
    for (const dir of [a, b]) {
      expect(await readlink(path.join(dir, 'auth.json'))).toBe(
        path.join(real, 'auth.json'),
      );
      expect(await readlink(path.join(dir, 'config.toml'))).toBe(
        path.join(real, 'config.toml'),
      );
      // Sessions and history stay with the workspace.
      expect(existsSync(path.join(dir, 'history.jsonl'))).toBe(false);
    }
    // Preparing again keeps what is there.
    await expect(
      prepareCodexHome(path.join(root, 'a', 'codex-home'), real),
    ).resolves.toBe(a);
  });

  it("is set for the agent, which keeps the runner user's real HOME", () => {
    const env = buildAgentEnv({
      source: { PATH: '/usr/bin', HOME: '/home/runner' },
      tmpDir: '/w/.nocobase-runner/tmp',
      codexHome: '/w/.nocobase-runner/codex-home',
    });
    expect(env).toMatchObject({
      HOME: '/home/runner',
      TMPDIR: '/w/.nocobase-runner/tmp',
      CODEX_HOME: '/w/.nocobase-runner/codex-home',
    });
    // A run cannot point Codex elsewhere.
    expect(forbidden('CODEX_HOME')).toBe(true);
    expect(
      buildAgentEnv({
        source: { HOME: '/home/runner' },
        workspace: {
          env: [{ name: 'CODEX_HOME', value: '/elsewhere' }],
          passthrough: [],
        },
      }).CODEX_HOME,
    ).toBeUndefined();
  });
});
