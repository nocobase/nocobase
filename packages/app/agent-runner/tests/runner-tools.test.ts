import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildAgentEnv } from '../src/agent/env.ts';
import {
  bundledPnpmEntry,
  writeRunnerTools,
} from '../src/agent/runner-tools.ts';
import { removeDir, tempDir } from './helpers.ts';

const pnpmVersion = (
  createRequire(import.meta.url)('pnpm') as { version: string }
).version;

describe("the runner's Node.js and pnpm", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) removeDir(dir);
  });

  it('writes executable node and pnpm launchers that work without either on the machine', async () => {
    const binDir = path.join(tempDir('nocobase-runner-tools-'), 'bin');
    dirs.push(path.dirname(binDir));
    expect(bundledPnpmEntry()).toMatch(/pnpm\.m?c?js$/);
    expect(await writeRunnerTools(binDir)).toEqual(['node', 'pnpm']);
    for (const tool of ['node', 'pnpm'])
      expect(statSync(path.join(binDir, tool)).mode & 0o777).toBe(0o700);
    expect(readFileSync(path.join(binDir, 'node'), 'utf8')).toContain(
      process.execPath,
    );
    const root = path.dirname(binDir);
    // A workspace may request another pnpm; use the worker's real environment to keep the bundled release.
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ packageManager: 'pnpm@1.0.0' }),
    );
    const env = buildAgentEnv({
      source: { HOME: root },
      binDir,
      pinPnpm: true,
    });
    const run = (command: string) =>
      execFileSync('/bin/sh', ['-c', command], {
        cwd: root,
        env,
        encoding: 'utf8',
      }).trim();
    expect(run('node --version')).toBe(process.version);
    expect(run('pnpm --version')).toBe(pnpmVersion);
  });

  it('writes only node when no pnpm is bundled', async () => {
    const binDir = path.join(tempDir('nocobase-runner-tools-'), 'bin');
    dirs.push(path.dirname(binDir));
    expect(await writeRunnerTools(binDir, null)).toEqual(['node']);
  });

  it('puts the run bin first on PATH and keeps pnpm from switching versions only when it provides pnpm', () => {
    const source = { PATH: '/usr/local/bin:/usr/bin' };
    const env = buildAgentEnv({
      source,
      binDir: '/work/.nocobase-runner/bin',
      pinPnpm: true,
      workspace: {
        env: [{ name: 'pnpm_config_pm_on_fail', value: 'download' }],
        passthrough: [],
      },
    });
    expect(env.PATH).toBe('/work/.nocobase-runner/bin:/usr/local/bin:/usr/bin');
    expect(env).toMatchObject({
      pnpm_config_pm_on_fail: 'ignore',
      pnpm_config_manage_package_manager_versions: 'false',
      npm_config_manage_package_manager_versions: 'false',
    });
    expect(
      buildAgentEnv({ source, binDir: '/work/.nocobase-runner/bin' }),
    ).not.toHaveProperty('pnpm_config_pm_on_fail');
  });
});
