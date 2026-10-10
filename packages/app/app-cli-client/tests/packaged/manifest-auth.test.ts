import { serve, type ServerType } from '@hono/node-server';
import {
  CLI_ROUTES,
  HEADERS,
  RUN_CREDENTIALS_ENV,
} from '@nocobase/agent-protocol';
import type { CliManifest } from '@nocobase/app-cli-client';
import { Hono } from 'hono';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

const manifest: CliManifest = {
  version: 4,
  etag: 'commands-v1',
  identity: { kind: 'person', userId: 'u1', displayName: 'CI' },
  commands: [
    {
      id: 'app:ensure',
      summary: 'Ensure an application exists.',
      method: 'POST',
      path: '/main/api/apps/ensure',
      parameters: [],
      output: { kind: 'data' },
      identities: ['person', 'run'],
    },
    {
      id: 'deploy',
      summary: 'Deploy a release.',
      method: 'POST',
      path: '/main/api/deploys',
      parameters: [],
      output: { kind: 'data' },
      identities: ['person', 'run'],
    },
  ],
};

describe('manifest and business request authentication', () => {
  let server: ServerType;
  let url: string;
  let home: string;
  let env: NodeJS.ProcessEnv;
  let refuseManifest: boolean;
  const seen: {
    path: string;
    apiKey: string | undefined;
    runToken: string | undefined;
    authorization: string | undefined;
    etag: string | undefined;
  }[] = [];

  beforeAll(async () => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      const request = {
        path: c.req.path,
        apiKey: c.req.header(HEADERS.apiKey),
        runToken: c.req.header(HEADERS.runToken),
        authorization: c.req.header('authorization'),
        etag: c.req.header('if-none-match'),
      };
      seen.push(request);
      const authenticated =
        request.apiKey === 'ci-key' ||
        request.runToken === 'run-token' ||
        request.authorization === 'Bearer session-token';
      if (
        !authenticated ||
        (refuseManifest && c.req.path.endsWith(CLI_ROUTES.manifest))
      )
        return c.json(
          {
            error: {
              code: 401,
              status: 'UNAUTHENTICATED',
              reason: 'CLI_UNAUTHENTICATED',
              domain: 'cli',
              message: 'Sign in.',
            },
          },
          401,
        );
      await next();
    });
    app.get(`/main${CLI_ROUTES.manifest}`, (c) => {
      if (c.req.header('if-none-match') === '"commands-v1"')
        return c.body(null, 304);
      return c.json({
        data: {
          ...manifest,
          identity: c.req.header(HEADERS.runToken)
            ? { ...manifest.identity, kind: 'run', runId: 'r1' }
            : manifest.identity,
        },
      });
    });
    app.post('/main/api/apps/ensure', (c) => c.json({ data: { id: 'app1' } }));
    app.post('/main/api/deploys', (c) => c.json({ data: { deployed: true } }));
    await new Promise<void>((resolve) => {
      server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' }, () =>
        resolve(),
      );
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/main`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    home = tempDir('manifest-auth-');
    env = cliEnv(home);
    delete env.ACME_API_KEY;
    delete env.ACME_SERVER;
    delete env.ACME_PROFILE;
    seen.length = 0;
    refuseManifest = false;
    return () => removeDir(home);
  });

  it.each(['environment key', 'run token', 'profile session'] as const)(
    'authenticates cold and cached manifest commands with the %s',
    async (source) => {
      const auth: {
        apiKey: string | undefined;
        runToken: string | undefined;
        authorization: string | undefined;
      } = {
        apiKey: undefined,
        runToken: undefined,
        authorization: undefined,
      };
      if (source === 'profile session') {
        auth.authorization = 'Bearer session-token';
        writeFileSync(
          path.join(home, 'config.json'),
          JSON.stringify({
            current: 'default',
            profiles: {
              default: {
                server: url,
                auth: {
                  kind: 'session',
                  storage: 'file',
                  key: 'session-token',
                },
              },
            },
          }),
        );
      } else {
        env.ACME_SERVER = url;
        env.ACME_API_KEY = 'ci-key';
        auth.apiKey = 'ci-key';
        if (source === 'run token') {
          auth.apiKey = undefined;
          auth.runToken = 'run-token';
          const runFile = path.join(home, '.acme', 'run.json');
          mkdirSync(path.dirname(runFile));
          writeFileSync(
            runFile,
            JSON.stringify({
              server: url,
              token: 'run-token',
              runId: 'r1',
              expiresAt: '2099-01-01T00:00:00.000Z',
            }),
          );
          env[RUN_CREDENTIALS_ENV] = runFile;
        }
      }

      const ensure = await cli(['app', 'ensure', '--json'], env, { cwd: home });
      expect(ensure.code).toBe(0);
      expect(JSON.parse(ensure.stdout)).toMatchObject({
        ok: true,
        result: { data: { id: 'app1' } },
      });
      const deploy = await cli(['deploy', '--json'], env, { cwd: home });
      expect(deploy.code).toBe(0);
      expect(JSON.parse(deploy.stdout)).toMatchObject({
        ok: true,
        result: { data: { deployed: true } },
      });

      expect(seen).toEqual([
        { path: `/main${CLI_ROUTES.manifest}`, etag: undefined, ...auth },
        { path: '/main/api/apps/ensure', etag: undefined, ...auth },
        { path: `/main${CLI_ROUTES.manifest}`, etag: '"commands-v1"', ...auth },
        { path: '/main/api/deploys', etag: undefined, ...auth },
      ]);
      if (source !== 'profile session')
        expect(existsSync(path.join(home, 'config.json'))).toBe(false);
    },
  );

  it('does not execute from a cached manifest after a 401, or lose the environment key for later commands', async () => {
    env.ACME_SERVER = url;
    env.ACME_API_KEY = 'ci-key';
    expect(
      (await cli(['app', 'ensure', '--json'], env, { cwd: home })).code,
    ).toBe(0);
    seen.length = 0;
    refuseManifest = true;
    const refused = await cli(['deploy', '--json'], env, { cwd: home });
    expect(refused.code).toBe(3);
    expect(JSON.parse(refused.stdout)).toMatchObject({
      ok: false,
      error: { code: 'CLI_UNAUTHENTICATED' },
    });
    expect(seen.map((request) => request.path)).toEqual([
      `/main${CLI_ROUTES.manifest}`,
    ]);
    refuseManifest = false;
    const whoami = await cli(['whoami', '--json'], env, { cwd: home });
    expect(whoami.code).toBe(0);
    expect(JSON.parse(whoami.stdout)).toMatchObject({
      ok: true,
      result: { source: 'env', displayName: 'CI' },
    });
    const deployed = await cli(['deploy', '--json'], env, { cwd: home });
    expect(deployed.code).toBe(0);
    expect(seen.every((request) => request.apiKey === 'ci-key')).toBe(true);
    expect(existsSync(path.join(home, 'config.json'))).toBe(false);
  });
});
