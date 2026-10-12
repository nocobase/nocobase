// @vitest-environment node
/**
 * The plugin's part of the application's command line: a run token as a credential of the application's
 * authentication, the manifest's callers, and the CLI of an online run's shell, built from the manifest.
 */
import { HEADERS } from '@nocobase/agent-protocol';
import type { AuthSession } from '@nocobase/app-plugin-authentication';
import { cliRoute, describeRoute } from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import {
  runCredentialResolver,
  runIdentityOf,
} from '../server/cli/run-credential.js';
import { createCliApp, personOrRun } from './cli-app.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});

async function runToken(harness: Harness): Promise<string> {
  const agentId = await harness.createAgent();
  await harness.enqueue(agentId, '7', { actorUserId: 'bob' });
  const runner = await harness.registerRunner();
  const [payload] = await claim(harness, runner);
  return payload.cli.credential.content.token as string;
}

describe('run credential', () => {
  it('acts for the person who woke the agent, and refuses a token that is not valid', async () => {
    h = await createHarness();
    const resolve = runCredentialResolver(h.services);
    const token = await runToken(h);
    const credential = await resolve(
      new Headers({ [HEADERS.runToken]: token }),
    );
    expect(credential).toMatchObject({
      type: 'run',
      userId: 'bob',
      scheme: 'runToken',
    });
    expect(await resolve(new Headers())).toBeUndefined();
    await expect(
      resolve(new Headers({ [HEADERS.runToken]: 'nope' })),
    ).rejects.toMatchObject({ reason: 'RUN_TOKEN_INVALID' });

    const identity = runIdentityOf({
      credential,
    } as unknown as AuthSession);
    expect(identity).toMatchObject({ kind: 'run', userId: 'bob' });
    expect(runIdentityOf(null as unknown as AuthSession)).toBeUndefined();
  });
});

describe('CLI surface', () => {
  it('tells callers apart, offers runs what lists runToken, and each caller the actions it holds', async () => {
    h = await createHarness();
    const services = h.services;
    services.gate.set({
      explain: async (_identity, action) => ({
        permissionReason: 'ACTOR_LACKS_ACTION',
        requiredAction: action,
      }),
      allowed: (identity) =>
        Promise.resolve(
          new Set(
            identity.kind === 'run'
              ? ['docs/read', 'docs/write']
              : ['docs/read', 'docs/write', 'docs/delete'],
          ),
        ),
    });
    const api = new Hono();
    const route = (command: string, action: string, run = true) =>
      describeRoute({
        tags: ['Docs'],
        summary: command,
        security: run ? personOrRun : [{ apiKeyAuth: [] }],
        responses: { 200: { description: 'OK' } },
        ...cliRoute({ command, action }),
      });
    api.get('/docs/:docId', route('doc get', 'docs/read'), (context) =>
      context.json({ data: null }),
    );
    // A person's route only: a run is not offered it, whatever it holds.
    api.put(
      '/docs/:docId',
      route('doc write', 'docs/write', false),
      (context) => context.json({ data: null }),
    );
    // Held by nobody's run: the gate gives it to people only.
    api.delete('/docs/:docId', route('doc delete', 'docs/delete'), (context) =>
      context.json({ data: null }),
    );
    const authenticatePerson: MiddlewareHandler = async (context, next) => {
      if (context.req.header('x-person') !== 'ada')
        return context.json({}, 401);
      context.set('auth', { user: { id: 'ada', name: 'Ada' } } as never);
      await next();
    };
    const { app, cli, surface } = createCliApp(services, api, {
      authenticatePerson,
    });
    const token = await runToken(h);
    const manifest = async (headers: Record<string, string>) => {
      const response = await app.request('/api/cli/manifest', { headers });
      return {
        status: response.status,
        body: (await response.json()) as {
          data: {
            identity: { kind: string; userId: string };
            commands: { id: string }[];
            withheld: {
              id: string;
              permissionReason?: string;
              requiredAction?: string;
            }[];
          };
        },
      };
    };

    const run = await manifest({ [HEADERS.runToken]: token });
    expect(run.status).toBe(200);
    expect(run.body.data.identity).toMatchObject({
      kind: 'run',
      userId: 'bob',
    });
    expect(run.body.data.commands.map((command) => command.id)).toEqual([
      'doc:get',
    ]);
    expect(
      run.body.data.withheld.find((command) => command.id === 'doc:delete'),
    ).toMatchObject({
      permissionReason: 'ACTOR_LACKS_ACTION',
      requiredAction: 'docs/delete',
    });
    const person = await manifest({ 'x-person': 'ada' });
    expect(person.body.data.identity).toMatchObject({
      kind: 'person',
      userId: 'ada',
    });
    expect(
      person.body.data.commands.map((command) => command.id).sort(),
    ).toEqual(['doc:delete', 'doc:get', 'doc:write']);
    expect((await manifest({})).status).toBe(401);

    const caller = await surface.callerOf({
      kind: 'run',
      userId: 'bob',
      displayName: 'Echo',
    });
    expect(caller).toMatchObject({ kind: 'run', userId: 'bob' });
    expect([...(caller.actions ?? [])]).toEqual(
      expect.arrayContaining(['docs/read', 'docs/write']),
    );
    expect([...(caller.actions ?? [])]).not.toContain('docs/delete');
    surface.release();
    expect(cli.hasCallers()).toBe(false);
  });
});
