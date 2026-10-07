// @vitest-environment node
/**
 * The plugin's part of the application's command line: a run token as a credential of the application's
 * authentication, the manifest's callers, and the CLI of an online run's shell, built from the manifest.
 */
import { HEADERS } from '@nocobase/agent-protocol';
import type { AuthSession } from '@nocobase/app-plugin-authentication';
import {
  cliRoute,
  describeRoute,
  type CliCommand,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import {
  runCredentialResolver,
  runIdentityOf,
} from '../server/cli/run-credential.js';
import { cliCommand, onlineTools } from '../server/online/index.js';
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

describe("the CLI of an online run's shell", () => {
  it('sends each command through the application with the run token, and prints its answer', async () => {
    const requests: Request[] = [];
    const commands: CliCommand[] = [
      {
        id: 'issue:comment:add',
        summary: 'Comment.',
        method: 'POST',
        path: '/app/api/issues/{issueId}/comments',
        parameters: [
          {
            name: 'issue',
            field: 'issueId',
            in: 'path',
            position: 0,
            type: 'string',
            required: true,
          },
          {
            name: 'content',
            field: 'content',
            in: 'body',
            type: 'string',
            required: true,
            contentFile: true,
          },
          {
            name: 'attach',
            field: 'attachmentIds',
            in: 'file',
            type: 'string[]',
            required: false,
          },
        ],
        body: { media: 'application/json' },
        output: { kind: 'data' },
        identities: ['run'],
      },
      {
        id: 'issue:get',
        summary: 'Get.',
        method: 'GET',
        path: '/app/api/issues/{issueId}',
        parameters: [
          {
            name: 'issue',
            field: 'issueId',
            in: 'path',
            position: 0,
            type: 'string',
            required: true,
          },
          {
            name: 'expand',
            field: 'expand',
            in: 'query',
            type: 'string',
            required: false,
          },
        ],
        output: { kind: 'data' },
        identities: ['run'],
      },
    ];
    const upload: CliCommand = {
      id: 'issue:attachment:add',
      summary: 'Attach.',
      method: 'POST',
      path: '/app/api/issues/{issueId}/attachments',
      parameters: [
        { ...commands[0]!.parameters[0]! },
        { ...commands[0]!.parameters[2]!, required: true },
      ],
      body: { media: 'application/json' },
      output: { kind: 'data' },
      identities: ['run'],
    };
    const download: CliCommand = {
      ...commands[1]!,
      id: 'issue:export',
      output: { kind: 'download' },
    };
    const [bash] = onlineTools(
      [],
      [
        cliCommand({
          bin: 'acme',
          commands: [...commands, upload, download],
          send: (request) => {
            requests.push(
              new Request(`http://application${request.path}`, {
                method: request.method,
                ...(request.body === undefined ? {} : { body: request.body }),
              }),
            );
            return Promise.resolve(
              request.method === 'GET'
                ? Response.json({
                    data: { id: '1' },
                    meta: { message: 'PM-1' },
                  })
                : Response.json(
                    {
                      error: {
                        code: 403,
                        status: 'PERMISSION_DENIED',
                        reason: 'FORBIDDEN',
                        domain: 'issues',
                        message: 'No.',
                      },
                    },
                    { status: 403 },
                  ),
            );
          },
        }),
      ],
    );
    const run = async (command: string) =>
      (await bash!.invoke({ command })).output;

    expect(await run('acme --help')).toContain('issue get');
    expect(await run('acme issue get --help')).toContain('--expand <string>');
    expect(await run('acme docs issue get')).toContain(
      'GET /app/api/issues/{issueId}',
    );
    expect(await run("acme issue get 'PM 1' --expand x")).toBe(
      'exit code 0\nPM-1',
    );
    expect(requests[0]!.url).toBe(
      'http://application/app/api/issues/PM%201?expand=x',
    );
    const json = await run('acme issue get PM-1 --json');
    expect(JSON.parse(json.slice(json.indexOf('\n') + 1))).toMatchObject({
      ok: true,
      command: 'issue get',
      result: { data: { id: '1' }, meta: { message: 'PM-1' } },
    });
    expect(await run('acme issue get PM-1 --nope')).toMatch(
      /^exit code 5\n[\s\S]*Unknown flag --nope\./u,
    );
    expect(await run('acme issue get')).toContain('MISSING_ARGUMENT');

    // A refusal keeps the CLI's exit code and the error's reason.
    const refused = await run(
      "printf 'Hi from a file' > /tmp/c.md && acme issue comment add PM-1 --content-file /tmp/c.md --json",
    );
    expect(refused).toMatch(/^exit code 3\n/u);
    expect(
      JSON.parse(refused.slice(refused.indexOf('\n') + 1)).error,
    ).toMatchObject({ code: 'FORBIDDEN', message: 'No.' });
    expect(await requests.at(-1)!.json()).toEqual({
      content: 'Hi from a file',
    });

    // A file of the caller's machine: refused, and nothing is sent.
    const sent = requests.length;
    expect(
      await run('acme issue comment add PM-1 --content Hi --attach a.png'),
    ).toContain('FILES_UNAVAILABLE');
    expect(await run('acme issue attachment add PM-1')).toContain(
      'FILES_UNAVAILABLE',
    );
    expect(await run('acme issue export PM-1')).toContain('FILES_UNAVAILABLE');
    expect(requests).toHaveLength(sent);
  });
});
