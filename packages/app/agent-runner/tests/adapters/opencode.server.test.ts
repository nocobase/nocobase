/**
 * The server launcher against stand-in `opencode` shell scripts: arguments,
 * environment, address parsing and shutdown.
 */
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { launchServer } from '../../src/agent/adapters/opencode/server.ts';

async function script(body: string): Promise<{ bin: string; dir: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-opencode-'));
  const bin = path.join(dir, 'opencode');
  await writeFile(bin, `#!/bin/sh\n${body}\n`);
  await chmod(bin, 0o755);
  return { bin, dir };
}

describe('launchServer', () => {
  it('binds to 127.0.0.1 on port 0 with a random password, and closes', async () => {
    const { bin, dir } = await script(
      [
        'echo "$*" > "$PWD/args"',
        'printf "%s %s %s" "$OPENCODE_SERVER_USERNAME" "${#OPENCODE_SERVER_PASSWORD}" "$ONLY" > "$PWD/env"',
        'echo "server listening on http://127.0.0.1:4567"',
        'exec sleep 30',
      ].join('\n'),
    );
    const server = await launchServer({
      binary: bin,
      cwd: dir,
      env: { PATH: process.env.PATH ?? '/usr/bin:/bin', ONLY: 'yes' },
    });
    expect(server.baseUrl).toBe('http://127.0.0.1:4567');
    expect(server.username).toBe('opencode');
    expect(server.password.length).toBeGreaterThanOrEqual(32);
    expect((await readFile(path.join(dir, 'args'), 'utf8')).trim()).toBe(
      'serve --hostname 127.0.0.1 --port 0',
    );
    expect(await readFile(path.join(dir, 'env'), 'utf8')).toBe(
      `opencode ${server.password.length} yes`,
    );
    const t0 = Date.now();
    await server.close(2000);
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(await server.exited).toMatchObject({ signal: 'SIGTERM' });
  });

  it('kills a server that ignores SIGTERM', async () => {
    const { bin, dir } = await script(
      [
        "trap '' TERM",
        'echo "server listening on http://127.0.0.1:4568"',
        'while true; do sleep 1; done',
      ].join('\n'),
    );
    const server = await launchServer({
      binary: bin,
      cwd: dir,
      env: { PATH: process.env.PATH ?? '/usr/bin:/bin' },
    });
    await server.close(200);
    expect((await server.exited).signal).toBe('SIGKILL');
  });

  it('reports a server that exits before listening, with its stderr', async () => {
    const { bin, dir } = await script('echo "no provider" >&2\nexit 3');
    await expect(
      launchServer({ binary: bin, cwd: dir, env: { PATH: '/usr/bin:/bin' } }),
    ).rejects.toThrow(/exited with code 3.*no provider/s);
  });

  it('refuses an address other than 127.0.0.1', async () => {
    const { bin, dir } = await script(
      'echo "server listening on http://0.0.0.0:4569"\nexec sleep 30',
    );
    await expect(
      launchServer({ binary: bin, cwd: dir, env: { PATH: '/usr/bin:/bin' } }),
    ).rejects.toThrow(/not 127\.0\.0\.1/);
  });

  it('gives up on a server that never reports, or when aborted', async () => {
    const { bin, dir } = await script('exec sleep 30');
    await expect(
      launchServer({
        binary: bin,
        cwd: dir,
        env: { PATH: '/usr/bin:/bin' },
        startTimeoutMs: 100,
      }),
    ).rejects.toThrow(/did not report its address/);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    await expect(
      launchServer({
        binary: bin,
        cwd: dir,
        env: { PATH: '/usr/bin:/bin' },
        signal: controller.signal,
      }),
    ).rejects.toThrow(/aborted/);
  });

  it('reports a missing binary', async () => {
    await expect(
      launchServer({
        binary: '/nonexistent/opencode',
        cwd: tmpdir(),
        env: {},
      }),
    ).rejects.toThrow(/ENOENT/);
  });
});
