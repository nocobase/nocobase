// Signing in through the browser (device authorization), profiles, keys from the environment, signing out, `whoami`,
// the global flags, why a command is missing, completion and `docs`, against a fake server.
import { serve, type ServerType } from '@hono/node-server';
import { CLI_ROUTES, HEADERS } from '@nocobase/agent-protocol';
import type { CliCommand, CliManifest } from '@nocobase/app-cli-client';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

const COMMANDS: CliCommand[] = [
  {
    id: 'issue:get',
    summary: 'Show an issue.',
    method: 'GET',
    path: '/api/projects/issues/{issueId}',
    parameters: [
      {
        name: 'issue',
        field: 'issueId',
        in: 'path',
        position: 0,
        type: 'string',
        required: true,
      },
    ],
    output: { kind: 'data' },
    identities: ['person', 'run'],
    action: 'pm.issues/view',
    examples: ['issue get PM-12'],
  },
  {
    id: 'plan:undo',
    summary: 'Undo a plan.',
    method: 'POST',
    path: '/api/projects/plans/{planId}/undo',
    parameters: [
      {
        name: 'plan',
        field: 'planId',
        in: 'path',
        position: 0,
        type: 'string',
        required: true,
      },
      {
        name: 'dry-run',
        field: 'dryRun',
        in: 'body',
        type: 'boolean',
        required: false,
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    confirm: 'Undo the plan?',
    identities: ['person'],
  },
];

/** A server with Better Auth's device authorization: the code is approved on the second poll. */
class AuthServer {
  url = '';
  polls = 0;
  signedOut: string[] = [];
  seen: {
    method: string;
    path: string;
    body?: unknown;
    userAgent?: string | undefined;
  }[] = [];
  private server: ServerType | undefined;

  async listen(): Promise<void> {
    const app = new Hono();
    /** The credential a request presents: a session token as Bearer, or an API key. */
    const credentialOf = (c: {
      req: { header(name: string): string | undefined };
    }) =>
      c.req.header('authorization')?.replace(/^Bearer /u, '') ??
      c.req.header(HEADERS.apiKey);
    app.post('/api/auth/device/code', async (c) => {
      this.seen.push({
        method: 'POST',
        path: c.req.path,
        body: await c.req.json(),
        userAgent: c.req.header('user-agent'),
      });
      return c.json({
        device_code: 'device-1',
        user_code: 'WXYZ2345',
        verification_uri: `${this.url}/device`,
        verification_uri_complete: `${this.url}/device?user_code=WXYZ2345`,
        expires_in: 600,
        interval: 1,
      });
    });
    app.post('/api/auth/device/token', async (c) => {
      const body = await c.req.json<{
        device_code: string;
        client_id: string;
      }>();
      this.polls += 1;
      if (body.device_code !== 'device-1' || body.client_id !== 'acme')
        return c.json({ error: 'invalid_grant' }, 400);
      if (this.polls < 2)
        return c.json({ error: 'authorization_pending' }, 400);
      return c.json({
        access_token: 'session-token',
        token_type: 'Bearer',
        expires_in: 604800,
      });
    });
    app.get('/api/auth/get-session', (c) =>
      c.req.header('authorization') === 'Bearer session-token'
        ? c.json({
            session: { expiresAt: '2026-10-13T00:00:00.000Z' },
            user: { id: 'u1' },
          })
        : c.json(null),
    );
    app.post('/api/auth/sign-out', (c) => {
      const token = c.req.header('authorization')?.replace(/^Bearer /u, '');
      if (token) this.signedOut.push(token);
      return c.json({ success: true });
    });
    app.get(CLI_ROUTES.manifest, (c) => {
      const key = credentialOf(c);
      if (!key || this.signedOut.includes(key))
        return c.json(
          {
            error: {
              code: 401,
              status: 'UNAUTHENTICATED',
              reason: 'CLI_UNAUTHENTICATED',
              domain: 'app',
              message: 'Sign in.',
            },
          },
          401,
        );
      const manifest: CliManifest = {
        version: 4,
        etag: `e-${key}`,
        identity: {
          kind: 'person',
          userId: 'u1',
          displayName: key === 'ci-key' ? 'CI' : 'Ada',
          actions: ['pm.issues/view'],
        },
        commands: COMMANDS,
        withheld: [
          {
            id: 'issue:delete',
            summary: 'Delete an issue.',
            reason: 'action',
            identities: ['person', 'run'],
            action: 'pm.issues/delete',
          },
          {
            id: 'run:self',
            summary: 'Show this run.',
            reason: 'identity',
            identities: ['run'],
          },
        ],
      };
      return c.json({ data: manifest });
    });
    app.all('*', async (c) => {
      this.seen.push({
        method: c.req.method,
        path: c.req.path,
        ...(c.req.method === 'GET' ? {} : { body: await c.req.json() }),
      });
      return c.json({ data: { id: 'x', title: 'Fix login' } });
    });
    await new Promise<void>((resolve) => {
      this.server = serve({ fetch: app.fetch, port: 0 }, () => resolve());
    });
    this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}

const json = (stdout: string) =>
  JSON.parse(stdout) as {
    ok: boolean;
    status: string;
    result: Record<string, unknown>;
    error: { code: string; message: string; suggestions: unknown[] };
  };

describe('signing in, profiles and the global flags', () => {
  const server = new AuthServer();
  let home: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(async () => {
    await server.listen();
  });
  afterAll(async () => {
    await server.close();
  });
  beforeEach(() => {
    home = tempDir('acme-session-');
    env = cliEnv(home);
    delete env.ACME_API_KEY;
    delete env.ACME_SERVER;
    delete env.ACME_PROFILE;
    server.polls = 0;
    server.signedOut.length = 0;
    server.seen.length = 0;
    return () => removeDir(home);
  });

  const login = async (profile?: string) =>
    cli(
      [
        'login',
        '--server',
        server.url,
        '--json',
        ...(profile ? ['--profile', profile] : []),
      ],
      env,
      { cwd: home },
    );

  it('signs in through the browser: shows the code, waits for the approval, and keeps the session it was given', async () => {
    const result = await login();
    expect(result.code).toBe(0);
    expect(result.stderr).toContain('Your one-time code: WXYZ-2345');
    expect(result.stderr).toContain('/device?user_code=WXYZ2345');
    expect(json(result.stdout).result).toMatchObject({
      server: server.url,
      profile: 'default',
      method: 'browser',
      displayName: 'Ada',
    });
    expect(server.seen[0]).toMatchObject({
      path: '/api/auth/device/code',
      body: { client_id: 'acme' },
      userAgent: expect.stringMatching(/^acme\/\S+ \(/u),
    });
    expect(server.polls).toBe(2);
    expect(
      JSON.parse(readFileSync(path.join(home, 'config.json'), 'utf8')),
    ).toMatchObject({
      current: 'default',
      profiles: {
        default: {
          server: server.url,
          auth: { kind: 'session', storage: 'file', key: 'session-token' },
        },
      },
    });

    const whoami = await cli(['whoami', '--missing'], env, { cwd: home });
    expect(whoami.code).toBe(0);
    expect(whoami.stdout).toContain(`Ada (u1) on ${server.url}`);
    expect(whoami.stdout).toContain(
      'Profile  default, signed in through the browser, session expires 2026-10-13T00:00:00.000Z',
    );
    expect(whoami.stdout).toContain('Actions  pm.issues/view');
    expect(whoami.stdout).toContain(
      'Commands 2 offered; 1 need an action you do not hold:',
    );
    expect(whoami.stdout).toContain('  pm.issues/delete: issue delete');
  });

  it('signs out, ending the session on the server and leaving an API key to where it was created', async () => {
    await login();
    const dry = await cli(['logout', '--dry-run', '--json'], env, {
      cwd: home,
    });
    expect(json(dry.stdout)).toMatchObject({
      status: 'success-noop',
      result: { dryRun: true },
    });
    expect(server.signedOut).toEqual([]);
    const out = await cli(['logout'], env, { cwd: home });
    expect(out.code).toBe(0);
    expect(out.stdout).toContain('the session is ended');
    expect(server.signedOut).toEqual(['session-token']);
    const whoami = await cli(['whoami'], env, { cwd: home });
    expect(whoami.code).toBe(3);

    await cli(['login', '--server', server.url, '--api-key-stdin'], env, {
      cwd: home,
      input: 'own-key\n',
    });
    const kept = await cli(['logout'], env, { cwd: home });
    expect(kept.code).toBe(0);
    expect(kept.stderr).toContain('The API key stays valid');
  });

  it('keeps a profile per server, and acts as the one --profile or ACME_PROFILE names', async () => {
    await login();
    await cli(
      ['login', '--server', server.url, '--profile', 'ci', '--api-key-stdin'],
      env,
      { cwd: home, input: 'ci-key\n' },
    );
    const list = await cli(['profile', 'list', '--json'], env, { cwd: home });
    expect(json(list.stdout).result).toMatchObject({
      profiles: [
        { name: 'ci', current: true },
        { name: 'default', current: false },
      ],
    });
    const asDefault = await cli(
      ['whoami', '--profile', 'default', '--json'],
      env,
      {
        cwd: home,
      },
    );
    expect(json(asDefault.stdout).result).toMatchObject({
      displayName: 'Ada',
      profile: 'default',
    });
    const fromEnv = await cli(
      ['whoami', '--json'],
      { ...env, ACME_PROFILE: 'default' },
      { cwd: home },
    );
    expect(json(fromEnv.stdout).result).toMatchObject({ profile: 'default' });
    expect(
      (await cli(['profile', 'use', 'default'], env, { cwd: home })).code,
    ).toBe(0);
    const removed = await cli(['profile', 'remove', 'ci', '--yes'], env, {
      cwd: home,
    });
    expect(removed.code).toBe(0);
    const missing = await cli(['whoami', '--profile', 'ci'], env, {
      cwd: home,
    });
    expect(missing.code).toBe(3);
    expect(missing.stderr).toContain('There is no profile ci');
  });

  it('acts with ACME_SERVER and ACME_API_KEY without signing in', async () => {
    const result = await cli(
      ['whoami', '--json'],
      { ...env, ACME_SERVER: server.url, ACME_API_KEY: 'ci-key' },
      { cwd: home },
    );
    expect(json(result.stdout).result).toMatchObject({
      displayName: 'CI',
      source: 'env',
    });
  });

  it('says which action a missing command needs, and whose command it is', async () => {
    await login();
    const needs = await cli(['issue', 'delete', 'PM-1', '--json'], env, {
      cwd: home,
    });
    expect(needs.code).toBe(3);
    expect(json(needs.stdout).error).toMatchObject({
      code: 'ACTION_REQUIRED',
      message:
        '`acme issue delete` needs the action pm.issues/delete, which you do not hold.',
    });
    const runOnly = await cli(['run', 'self'], env, { cwd: home });
    expect(runOnly.code).toBe(3);
    expect(runOnly.stderr).toContain("is only for an agent's run");
  });

  it('passes --dry-run to a command that has one, refuses it elsewhere, and keeps -q quiet', async () => {
    await login();
    const undo = await cli(
      ['plan', 'undo', 'p1', '--dry-run', '--yes', '--json'],
      env,
      { cwd: home },
    );
    expect(json(undo.stdout).status).toBe('success-noop');
    expect(server.seen.at(-1)).toMatchObject({
      method: 'POST',
      path: '/api/projects/plans/p1/undo',
      body: { dryRun: true },
    });
    const refused = await cli(
      ['issue', 'get', 'PM-1', '--dry-run', '--json'],
      env,
      {
        cwd: home,
      },
    );
    expect(refused.code).toBe(5);
    expect(json(refused.stdout).error.code).toBe('DRY_RUN_UNSUPPORTED');
    const before = server.seen.length;
    const whoami = await cli(['whoami', '--dry-run'], env, { cwd: home });
    expect(whoami.code).toBe(5);
    expect(whoami.stderr).toContain('has no dry run');
    expect(server.seen.length).toBe(before);
    const quiet = await cli(['issue', 'get', 'PM-1', '-q'], env, { cwd: home });
    expect(quiet.code).toBe(0);
    expect(quiet.stdout).toBe('');
    const missing = await cli(['issue', 'get', '--json'], env, { cwd: home });
    expect(json(missing.stdout).error).toMatchObject({
      code: 'MISSING_ARGUMENT',
      message: 'acme issue get needs <issue>.',
    });
  });

  it('completes from the cached manifest, and documents a command', async () => {
    await login();
    const script = await cli(['completion', 'zsh'], env, { cwd: home });
    expect(script.stdout).toContain('compdef _acme acme');
    const words = await cli(['__complete', '--', 'issue', ''], env, {
      cwd: home,
    });
    expect(words.stdout.split('\n')).toContain('get');
    const top = await cli(['__complete', '--', 'pro'], env, { cwd: home });
    expect(top.stdout).toBe('profile\n');
    const docs = await cli(['docs', 'issue', 'get'], env, { cwd: home });
    expect(docs.code).toBe(0);
    expect(docs.stdout).toContain('holding the action pm.issues/view');
    expect(docs.stdout).toContain('$ acme issue get PM-12');
    const docsJson = await cli(['docs', 'issue', 'get', '--json'], env, {
      cwd: home,
    });
    expect(json(docsJson.stdout).result).toMatchObject({
      command: { id: 'issue:get', action: 'pm.issues/view' },
    });
    const overview = await cli(['docs'], env, { cwd: home });
    expect(overview.stdout).toContain('GLOBAL FLAGS');
    expect(overview.stdout).toMatch(/issue\s+1 command/u);
  });
});
