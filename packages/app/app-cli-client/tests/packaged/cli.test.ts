// The static commands (login, whoami), and the spike for business commands that only the server's manifest knows.
import { serve, type ServerType } from '@hono/node-server';
import { Config, run } from '@oclif/core';
import { CLI_ROUTES, HEADERS } from '@nocobase/agent-protocol';
import { Hono } from 'hono';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// oclif loads the command files with Node's own import(), outside Vite: give it the resolve hooks bin/run.js uses.
import '../fixtures/source-hooks.js';

import { cli, cliEnv, PACKAGE_ROOT, removeDir, tempDir } from './helpers.ts';

/** Answers the manifest route for one API key and one run token. */
function identityServer(): { app: Hono } {
  const app = new Hono();
  app.get(CLI_ROUTES.manifest, (c) => {
    if (c.req.header(HEADERS.runToken) === 'run-token')
      return c.json({
        data: {
          version: 2,
          etag: 'e',
          identity: {
            kind: 'run',
            runId: 'r1',
            userId: 'u1',
            displayName: 'Ada',
          },
          commands: [],
        },
      });
    if (c.req.header(HEADERS.apiKey) === 'user-key')
      return c.json({
        data: {
          version: 2,
          etag: 'e',
          identity: { kind: 'person', userId: 'u1', displayName: 'Ada' },
          commands: [],
        },
      });
    return c.json(
      {
        error: {
          code: 401,
          status: 'UNAUTHENTICATED',
          reason: 'AUTHENTICATION_REQUIRED',
          domain: 'authentication',
          message: 'no',
        },
      },
      401,
    );
  });
  return { app };
}

describe('a packaged cli', () => {
  let server: ServerType;
  let url = '';
  const home = tempDir('packaged-cli-home-');
  const env = cliEnv(home);

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = serve(
        {
          fetch: identityServer().app.fetch,
          port: 0,
          hostname: '127.0.0.1',
        },
        () => resolve(),
      );
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    removeDir(home);
  });

  it('prints its own name and version for --version', async () => {
    const { version } = JSON.parse(
      readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'),
    ) as { version: string };
    const result = await cli(['--version'], env);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(
      `acme/${version} ${process.platform}-${process.arch} node-${process.version}`,
    );
  });

  it('signs in with a key from stdin and tells who it is', async () => {
    const login = await cli(
      ['login', '--server', url, '--api-key-stdin'],
      env,
      {
        input: 'user-key\n',
      },
    );
    expect(login.code).toBe(0);
    expect(login.stdout).toContain('as Ada');
    // ACME_KEYCHAIN=off: the key goes into config.json, with a warning saying so.
    expect(login.stderr).toContain(
      'ACME_KEYCHAIN turns the system keychain off',
    );
    expect(
      JSON.parse(readFileSync(path.join(home, 'config.json'), 'utf8')),
    ).toEqual({
      current: 'default',
      profiles: {
        default: {
          server: url,
          auth: { kind: 'apiKey', storage: 'file', key: 'user-key' },
        },
      },
    });
    expect(statSync(path.join(home, 'config.json')).mode & 0o777).toBe(0o600);
    const whoami = await cli(['whoami', '--json'], env, { cwd: home });
    expect(JSON.parse(whoami.stdout)).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'whoami',
      status: 'success',
      result: {
        kind: 'person',
        userId: 'u1',
        displayName: 'Ada',
        server: url,
        source: 'profile',
        profile: 'default',
        credential: 'apiKey',
        actions: [],
        commands: 0,
        missing: [],
      },
      warnings: [],
    });
  });

  it("acts as the run inside a run's working directory", async () => {
    const work = tempDir('packaged-cli-work-');
    try {
      mkdirSync(path.join(work, '.acme'));
      mkdirSync(path.join(work, 'app'));
      writeFileSync(
        path.join(work, '.acme', 'run.json'),
        JSON.stringify({
          server: url,
          token: 'run-token',
          runId: 'r1',
          expiresAt: '2099-01-01T00:00:00.000Z',
        }),
      );
      const whoami = await cli(['whoami', '--json'], env, {
        cwd: path.join(work, 'app'),
      });
      expect(JSON.parse(whoami.stdout)).toMatchObject({
        ok: true,
        result: { kind: 'run', runId: 'r1' },
      });
    } finally {
      removeDir(work);
    }
  });

  it('asks for a new login when config.json does not say where the key is', async () => {
    const other = tempDir('packaged-cli-old-');
    try {
      // The shape before the keychain: no `auth.storage`.
      writeFileSync(
        path.join(other, 'config.json'),
        JSON.stringify({ server: url, auth: { kind: 'apiKey', key: 'k' } }),
      );
      const whoami = await cli(['whoami'], cliEnv(other), { cwd: other });
      expect(whoami.code).toBe(3);
      expect(whoami.stderr).toContain('Not signed in. Run `acme login` first');
    } finally {
      removeDir(other);
    }
  });

  it('never falls back to the person once a run has ended', async () => {
    const work = tempDir('packaged-cli-ended-');
    try {
      const whoami = await cli(
        ['whoami'],
        cliEnv(home, {
          AGENT_RUN_CREDENTIALS: path.join(work, '.acme', 'run.json'),
        }),
        { cwd: work },
      );
      expect(whoami.code).toBe(3);
      // oclif wraps the message at the terminal width, and the path in it varies.
      expect(
        whoami.stderr.replace(/\s*›\s*/gu, ' ').replace(/\s+/gu, ' '),
      ).toContain('the run has ended');
    } finally {
      removeDir(work);
    }
  });

  it('exits 3 for a rejected key and 4 for an unknown command', async () => {
    const bad = await cli(
      ['login', '--server', url, '--token', 'nope'],
      cliEnv(tempDir()),
    );
    expect(bad.code).toBe(3);
    const unknown = await cli(
      ['issue', 'comment', 'add', 'PM-1', '--body', 'x'],
      env,
    );
    expect(unknown.code).toBe(4);
    expect(unknown.stderr).toContain(
      'Unknown command: acme issue comment add PM-1',
    );
  });
});

describe('spike: dynamic commands through command_not_found', () => {
  const load = () =>
    Config.load({
      root: PACKAGE_ROOT,
      pjson: {
        name: 'spike',
        version: '0.0.0',
        oclif: {
          bin: 'acme',
          topicSeparator: ' ',
          commands: {
            strategy: 'explicit',
            target: '../spike-commands.ts',
            identifier: 'COMMANDS',
          },
          hooks: { command_not_found: '../spike-hook.ts' },
        },
      } as never,
    });

  it('receives the unknown id with positional words folded in, and argv from the first flag', async () => {
    const config = await load();
    const result = await run(
      ['issue', 'comment', 'add', 'PM-1', 'extra', '--body', 'a=b', '--json'],
      config,
    );
    const seen =
      (globalThis as { acmeSpikeSeen?: { id: string; argv?: string[] }[] })
        .acmeSpikeSeen ?? [];
    expect(result).toBe('handled');
    expect(seen).toEqual([
      { id: 'issue:comment:add:PM-1:extra', argv: ['--body', 'a=b', '--json'] },
    ]);
    // A word holding the separator is split into two id parts, so the original argv is the only exact source.
    await run(['issue', 'get', 'a:b'], config);
    expect(seen[1]?.id).toBe('issue:get:a:b');
  });

  it('renders help for an unknown command without reaching the hook', async () => {
    const config = await load();
    const seen =
      (globalThis as { acmeSpikeSeen?: unknown[] }).acmeSpikeSeen ?? [];
    const before = seen.length;
    await expect(
      run(['issue', 'comment', 'add', '--help'], config),
    ).rejects.toThrow(/not found/);
    expect(seen.length).toBe(before);
  });
});
