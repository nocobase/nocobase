// Business commands built from the server's manifest: request commands sent to their API routes (path, query and body
// parameters, a body from a JSON file, files uploaded first, a file streamed to an upload ticket, a mount's changed
// files sent with the request), resolution from the original argv, help for commands oclif does not know, the etag cache, the cli-envelope
// under `--json`, and exit codes.
import { serve, type ServerType } from '@hono/node-server';
import {
  CLI_ROUTES,
  HEADERS,
  RUN_CREDENTIALS_ENV,
} from '@nocobase/agent-protocol';
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { CliCommand, CliManifest } from '@nocobase/app-cli-client';
import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

/** The standard error body. */
const failure = (
  reason: string,
  status: string,
  code: number,
  message: string,
  metadata?: Record<string, unknown>,
) => ({
  error: {
    code,
    status,
    reason,
    domain: 'projects',
    message,
    ...(metadata ? { metadata } : {}),
  },
});

const issue = {
  name: 'issue',
  field: 'issueId',
  in: 'path',
  position: 0,
  type: 'string',
  required: true,
  description: 'The issue.',
} as const;

const COMMANDS: CliCommand[] = [
  {
    id: 'issue:attachment:download',
    summary: 'Download a file of an issue.',
    method: 'GET',
    path: '/api/projects/attachments/{attachmentId}/content',
    parameters: [
      {
        name: 'file',
        field: 'attachmentId',
        in: 'path',
        position: 0,
        type: 'string',
        required: true,
      },
    ],
    output: { kind: 'download' },
    identities: ['person', 'run'],
  },
  {
    id: 'issue:get',
    summary: 'Show an issue.',
    method: 'GET',
    path: '/api/projects/issues/{issueId}',
    parameters: [issue],
    output: { kind: 'data' },
    identities: ['person', 'run'],
  },
  {
    id: 'issue:comment:add',
    summary: 'Comment on an issue.',
    method: 'POST',
    path: '/api/projects/issues/{issueId}/comments',
    parameters: [
      issue,
      {
        name: 'content',
        field: 'content',
        in: 'body',
        type: 'string',
        required: true,
        description: 'The comment.',
        contentFile: true,
      },
      {
        name: 'reply-to',
        field: 'parentId',
        in: 'body',
        type: 'string',
        required: false,
      },
      {
        name: 'attach',
        field: 'attachmentIds',
        in: 'file',
        type: 'string[]',
        required: false,
        upload: {
          method: 'POST',
          path: '/api/projects/attachments',
          part: 'file',
          field: 'attachmentIds',
          multiple: true,
          maxBytes: 1000,
        },
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['person', 'run'],
  },
  {
    id: 'issue:comment:list',
    summary: 'List comments.',
    method: 'GET',
    path: '/api/projects/issues/{issueId}/comments',
    parameters: [
      issue,
      {
        name: 'limit',
        field: 'pageSize',
        in: 'query',
        type: 'integer',
        required: false,
        default: 20,
      },
    ],
    output: {
      kind: 'list',
      columns: ['root.id', 'root.authorName', 'root.content'],
    },
    identities: ['person', 'run'],
  },
  {
    id: 'issue:update',
    summary: 'Change an issue.',
    method: 'PATCH',
    path: '/api/projects/issues/{issueId}',
    parameters: [
      issue,
      {
        name: 'status',
        field: 'statusKey',
        in: 'body',
        type: 'string',
        required: false,
      },
      {
        name: 'priority',
        field: 'priority',
        in: 'body',
        type: 'string',
        required: false,
        enum: ['high', 'low'],
      },
      {
        name: 'labels',
        field: 'labels',
        in: 'body',
        type: 'json',
        required: false,
      },
    ],
    body: { media: 'application/json', file: 'file' },
    output: { kind: 'data' },
    identities: ['person', 'run'],
  },
  {
    id: 'issue:delete',
    summary: 'Delete an issue.',
    method: 'DELETE',
    path: '/api/projects/issues/{issueId}',
    parameters: [issue],
    output: { kind: 'empty' },
    confirm: 'Delete the issue?',
    identities: ['person'],
  },
  {
    id: 'project:get',
    summary: 'Show a project.',
    method: 'GET',
    path: '/api/projects/{projectId}',
    parameters: [{ ...issue, name: 'project', field: 'projectId' }],
    output: { kind: 'data' },
    identities: ['person', 'run'],
  },
  {
    id: 'release:upload',
    summary: 'Upload a release.',
    method: 'POST',
    path: '/api/releases/apps/{appId}/uploadTickets',
    parameters: [
      {
        name: 'app',
        field: 'appId',
        in: 'path',
        position: 0,
        type: 'string',
        required: true,
      },
      {
        name: 'deploy',
        field: 'deploy',
        in: 'body',
        type: 'boolean',
        required: false,
      },
      {
        name: 'file',
        field: 'file',
        in: 'file',
        type: 'string',
        required: true,
        ticket: { maxBytes: 1000, accept: ['.tar.gz'] },
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['person'],
  },
  {
    id: 'deploy',
    summary: 'Deploy a release, or an archive.',
    method: 'POST',
    path: '/api/deploys',
    parameters: [
      {
        name: 'release',
        field: 'release',
        in: 'body',
        type: 'string',
        required: false,
      },
      {
        name: 'file',
        field: 'file',
        in: 'file',
        type: 'string',
        required: false,
        ticket: { maxBytes: 1000, optional: true },
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['person'],
  },
  {
    id: 'kb:propose',
    summary: 'Propose knowledge.',
    method: 'POST',
    path: '/api/knowledge/proposals',
    parameters: [
      {
        name: 'reason',
        field: 'reason',
        in: 'body',
        type: 'string',
        required: false,
      },
      {
        name: 'changed',
        field: 'files',
        in: 'file',
        type: 'boolean',
        required: false,
        changed: {
          dir: '.nocobase-runner/knowledge',
          manifest: '.manifest.json',
          maxBytes: 1000,
          maxFiles: 2,
          accept: ['.md'],
        },
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['person', 'run'],
  },
];

interface Seen {
  method: string;
  path: string;
  query: Record<string, string>;
  type: string;
  token?: string;
  key?: string;
  json?: unknown;
  fields?: Record<string, string>;
  files?: { field: string; name: string; type: string; text: string }[];
}

class ManifestServer {
  readonly seen: Seen[] = [];
  /** What reached the upload ticket's URL. */
  readonly uploads: {
    authorization?: string;
    key?: string;
    type: string;
    disposition?: string;
    text: string;
  }[] = [];
  manifestFetches = 0;
  manifestBodies = 0;
  etag = 'etag-1';
  private server?: ServerType;
  url = '';

  async listen(): Promise<void> {
    const app = new Hono();
    app.get(CLI_ROUTES.manifest, (c) => {
      this.manifestFetches += 1;
      if (c.req.header('if-none-match') === `"${this.etag}"`)
        return c.body(null, 304);
      this.manifestBodies += 1;
      const run = c.req.header(HEADERS.runToken);
      const manifest: CliManifest = {
        version: 2,
        etag: this.etag,
        identity: run
          ? { kind: 'run', runId: 'r1', userId: 'u1', displayName: 'Coder' }
          : { kind: 'person', userId: 'u1', displayName: 'Ada' },
        commands: COMMANDS,
      };
      return c.json({ data: manifest });
    });
    app.post('/api/uploads/:app', async (c) => {
      this.uploads.push({
        authorization: c.req.header('authorization'),
        key: c.req.header(HEADERS.apiKey),
        type: c.req.header('content-type') ?? '',
        disposition: c.req.header('content-disposition'),
        text: await c.req.text(),
      });
      if (c.req.param('app') === 'refused')
        return c.json(
          failure('TICKET_USED', 'PERMISSION_DENIED', 403, 'Used.'),
          403,
        );
      return c.json({
        data: { id: 'r1', version: '1.0.0' },
        meta: { message: 'Release r1: uploaded.' },
      });
    });
    app.all('/api/*', async (c) => {
      const seen: Seen = {
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        type: c.req.header('content-type') ?? '',
        ...(c.req.header(HEADERS.runToken)
          ? { token: c.req.header(HEADERS.runToken) }
          : {}),
        ...(c.req.header(HEADERS.apiKey)
          ? { key: c.req.header(HEADERS.apiKey) }
          : {}),
      };
      if (seen.type.startsWith('multipart/form-data')) {
        const form = await c.req.parseBody({ all: true });
        seen.files = [];
        seen.fields = {};
        for (const [field, value] of Object.entries(form))
          for (const item of [value].flat())
            if (typeof item === 'string') seen.fields[field] = item;
            else
              seen.files.push({
                field,
                name: item.name,
                type: item.type,
                text: await item.text(),
              });
      } else if (seen.type.startsWith('application/json'))
        seen.json = await c.req.json();
      this.seen.push(seen);
      const { path: route, method } = seen;
      const ticket = /^\/api\/releases\/apps\/([^/]+)\/uploadTickets$/u.exec(
        route,
      );
      if (ticket)
        return c.json({
          data: {
            url: `/api/uploads/${ticket[1]}`,
            method: 'POST',
            headers: { authorization: 'Bearer ticket-1' },
            message: 'Uploaded.',
          },
        });
      if (route === '/api/deploys') {
        const body = seen.json as { file?: string; release?: string };
        return body.file
          ? c.json({
              data: {
                url: '/api/uploads/deploy',
                method: 'POST',
                headers: { authorization: 'Bearer ticket-1' },
              },
            })
          : c.json({ data: { deployed: body.release } });
      }
      if (route === '/api/knowledge/proposals')
        return c.json({ data: { id: 'p1' } }, 201);
      if (route.startsWith('/api/projects/attachments/') && method === 'GET') {
        if (route.includes('missing'))
          return c.json(
            failure('NOT_FOUND', 'NOT_FOUND', 404, 'File not found.'),
            404,
          );
        return c.body('hello', 200, {
          'content-type': 'text/plain',
          'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent('../日志.txt')}`,
        });
      }
      if (route === '/api/projects/attachments' && method === 'POST')
        return c.json({ data: { id: `f${this.seen.length}` } }, 201);
      if (route.startsWith('/api/projects/attachments/') && method === 'DELETE')
        return c.body(null, 204);
      if (route.startsWith('/api/projects/p'))
        return c.json(
          failure('FORBIDDEN', 'PERMISSION_DENIED', 403, 'No.'),
          403,
        );
      if (route.endsWith('/comments') && method === 'POST') {
        const body = seen.json as { content?: string };
        if (body.content === 'conflict')
          return c.json(
            failure('PLAN_REQUIRED', 'FAILED_PRECONDITION', 400, 'Plan.', {
              reasons: ['quota'],
            }),
            400,
          );
        if (body.content === 'refused')
          return c.json(
            failure('INVALID_ATTACHMENT', 'INVALID_ARGUMENT', 400, 'No.'),
            400,
          );
        return c.json(
          { data: { comment: { id: 'c1', ...body }, triggered: [] } },
          201,
        );
      }
      if (route.endsWith('/comments'))
        return c.json({
          data: [
            {
              root: { id: 'c1', authorName: 'Bob', content: 'Hello\nworld' },
              replies: [],
            },
          ],
          meta: {},
        });
      if (method === 'DELETE') return c.body(null, 204);
      return c.json({
        data: { id: 'i1', title: 'Fix login', statusKey: 'todo' },
      });
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

describe('business commands from the manifest', () => {
  const server = new ManifestServer();
  let home: string;
  let work: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(async () => {
    await server.listen();
  });
  afterAll(async () => {
    await server.close();
  });
  beforeEach(() => {
    home = tempDir('acme-dyn-home-');
    work = tempDir('acme-dyn-work-');
    env = cliEnv(home);
    writeFileSync(
      path.join(home, 'config.json'),
      JSON.stringify({
        server: server.url,
        auth: { kind: 'apiKey', storage: 'file', key: 'k1' },
      }),
    );
    server.seen.length = 0;
    server.uploads.length = 0;
    return () => {
      removeDir(home);
      removeDir(work);
    };
  });

  it('sends a request command to its route, reading a flag from a file, and prints the envelope', async () => {
    writeFileSync(path.join(work, 'note.md'), 'Fixed.\n\nSee PR #3.');
    const result = await cli(
      [
        'issue',
        'comment',
        'add',
        'PM-1',
        '--content-file',
        'note.md',
        '--reply-to',
        'c0',
        '--json',
      ],
      env,
      { cwd: work },
    );
    expect(result.stderr).toBe('');
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'issue comment add',
      status: 'success',
      result: {
        data: {
          comment: {
            id: 'c1',
            content: 'Fixed.\n\nSee PR #3.',
            parentId: 'c0',
          },
          triggered: [],
        },
      },
      warnings: [],
    });
    expect(server.seen[0]).toMatchObject({
      method: 'POST',
      path: '/api/projects/issues/PM-1/comments',
      key: 'k1',
      json: { content: 'Fixed.\n\nSee PR #3.', parentId: 'c0' },
    });
  });

  it('keeps a word holding a colon whole, and acts as the run inside its work directory', async () => {
    mkdirSync(path.join(work, '.acme'));
    writeFileSync(
      path.join(work, '.acme', 'run.json'),
      JSON.stringify({
        server: server.url,
        token: 'run-token',
        runId: 'r1',
        manifestUrl: CLI_ROUTES.manifest,
        expiresAt: '2099-01-01T00:00:00.000Z',
      }),
    );
    const result = await cli(['issue', 'get', 'a:b'], env, { cwd: work });
    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      'id         i1\ntitle      Fix login\nstatusKey  todo\n',
    );
    expect(server.seen[0]).toMatchObject({
      method: 'GET',
      path: `/api/projects/issues/${encodeURIComponent('a:b')}`,
      token: 'run-token',
    });
  });

  it('acts as the run from any directory when the runner names its credentials file', async () => {
    const elsewhere = tempDir('packaged-cli-elsewhere-');
    const file = path.join(tempDir('packaged-cli-run-'), 'run.json');
    writeFileSync(
      file,
      JSON.stringify({
        server: server.url,
        token: 'named-run-token',
        runId: 'r2',
        manifestUrl: CLI_ROUTES.manifest,
        expiresAt: '2099-01-01T00:00:00.000Z',
      }),
    );
    try {
      const result = await cli(
        ['issue', 'get', 'PM-1'],
        { ...env, [RUN_CREDENTIALS_ENV]: file },
        { cwd: elsewhere },
      );
      expect(result.code).toBe(0);
      expect(server.seen.at(-1)).toMatchObject({ token: 'named-run-token' });
    } finally {
      removeDir(elsewhere);
      removeDir(path.dirname(file));
    }
  });

  it('renders help for a business command and a topic, and lists them in the root help', async () => {
    const command = await cli(['issue', 'comment', 'add', '--help'], env);
    expect(command.code).toBe(0);
    expect(command.stdout).toContain(
      '$ acme issue comment add <issue> [flags]',
    );
    expect(command.stdout).toContain('--content-file <path>');
    expect(command.stdout).toContain('--attach <path>');
    expect(command.stdout).toContain('--reply-to <string>');
    const upload = await cli(['release', 'upload', '--help'], env);
    expect(upload.stdout).toContain('--file <path>');
    expect(upload.stdout).toContain('streamed; at most 1000 bytes');
    const topic = await cli(['issue', '--help'], env);
    expect(topic.stdout).toContain('issue comment list');
    expect(topic.stdout).not.toContain('project get');
    const root = await cli(['--help'], env);
    expect(root.stdout).toContain('login');
    expect(root.stdout).toContain('BUSINESS COMMANDS');
    expect(root.stdout).toContain('project get');
    expect(server.seen).toEqual([]);
  });

  it('prints tables by column paths, sends query parameters, and caches the manifest by etag', async () => {
    const before = server.manifestBodies;
    const first = await cli(
      ['issue', 'comment', 'list', 'PM-1', '--limit', '5'],
      env,
    );
    expect(first.stdout).toBe(
      'ROOT.ID  ROOT.AUTHORNAME  ROOT.CONTENT\nc1       Bob              Hello world\n',
    );
    expect(server.seen[0]?.query).toEqual({ pageSize: '5' });
    const fetches = server.manifestFetches;
    await cli(['issue', 'get', 'PM-1'], env);
    expect(server.manifestFetches).toBe(fetches + 1);
    expect(server.manifestBodies).toBe(before + 1);
  });

  it('takes the body from a JSON file, with flags over it and objects as key=value', async () => {
    writeFileSync(path.join(work, 'bad.json'), '[1]');
    const bad = await cli(
      ['issue', 'update', 'PM-1', '--file', 'bad.json'],
      env,
      { cwd: work },
    );
    expect(bad.code).toBe(5);
    expect(bad.stderr).toContain('must hold a JSON object');
    const wrong = await cli(
      ['issue', 'update', 'PM-1', '--priority', 'urgent'],
      env,
      { cwd: work },
    );
    expect(wrong.code).toBe(5);
    expect(wrong.stderr).toContain('--priority must be one of high, low');
    writeFileSync(
      path.join(work, 'ok.json'),
      '{"title":"New","statusKey":"todo"}',
    );
    const ok = await cli(
      [
        'issue',
        'update',
        'PM-1',
        '--file',
        'ok.json',
        '--status',
        'in_review',
        '--labels',
        'area=api',
        '--labels',
        'team=core',
      ],
      env,
      { cwd: work },
    );
    expect(ok.code).toBe(0);
    expect(server.seen).toHaveLength(1);
    expect(server.seen[0]).toMatchObject({
      method: 'PATCH',
      json: {
        title: 'New',
        statusKey: 'in_review',
        labels: { area: 'api', team: 'core' },
      },
    });
  });

  it('uploads attachments first, sends their ids, and discards them when the request is refused', async () => {
    writeFileSync(path.join(work, 'shot.png'), 'png');
    writeFileSync(path.join(work, 'run.log'), 'line 1');
    const posted = await cli(
      [
        'issue',
        'comment',
        'add',
        'PM-1',
        '--content',
        'Log',
        '--attach',
        'shot.png',
        '--attach',
        'run.log',
      ],
      env,
      { cwd: work },
    );
    expect(posted.code).toBe(0);
    expect(server.seen.map((seen) => `${seen.method} ${seen.path}`)).toEqual([
      'POST /api/projects/attachments',
      'POST /api/projects/attachments',
      'POST /api/projects/issues/PM-1/comments',
    ]);
    // A file goes with the type of its extension.
    expect(server.seen[0]?.files).toEqual([
      { field: 'file', name: 'shot.png', type: 'image/png', text: 'png' },
    ]);
    expect(server.seen[2]?.json).toEqual({
      content: 'Log',
      attachmentIds: ['f1', 'f2'],
    });

    server.seen.length = 0;
    const refused = await cli(
      [
        'issue',
        'comment',
        'add',
        'PM-1',
        '--content',
        'refused',
        '--attach',
        'run.log',
      ],
      env,
      { cwd: work },
    );
    expect(refused.code).toBe(5);
    expect(refused.stderr).toContain('INVALID_ATTACHMENT');
    expect(server.seen.map((seen) => `${seen.method} ${seen.path}`)).toEqual([
      'POST /api/projects/attachments',
      'POST /api/projects/issues/PM-1/comments',
      'DELETE /api/projects/attachments/f1',
    ]);
    writeFileSync(path.join(work, 'big.bin'), 'x'.repeat(2000));
    const big = await cli(
      [
        'issue',
        'comment',
        'add',
        'PM-1',
        '--content',
        'Log',
        '--attach',
        'big.bin',
      ],
      env,
      { cwd: work },
    );
    expect(big.code).toBe(5);
  });

  it('answers a refusal in the envelope with its reason, and exits with its code', async () => {
    const plan = await cli(
      ['issue', 'comment', 'add', 'PM-1', '--content', 'conflict', '--json'],
      env,
    );
    expect(plan.code).toBe(7);
    expect(JSON.parse(plan.stdout)).toMatchObject({
      ok: false,
      command: 'issue comment add',
      status: 'failure',
      error: {
        code: 'PLAN_REQUIRED',
        message: 'Plan.',
        details: {
          httpStatus: 400,
          status: 'FAILED_PRECONDITION',
          metadata: { reasons: ['quota'] },
        },
      },
    });
    const usage = await cli(['issue', 'comment', 'add', 'PM-1', '--json'], env);
    expect(usage.code).toBe(5);
    expect(JSON.parse(usage.stdout)).toMatchObject({
      ok: false,
      error: {
        code: 'MISSING_ARGUMENT',
        suggestions: expect.arrayContaining([
          {
            message: 'See its arguments and flags.',
            run: {
              command: 'acme',
              args: ['issue', 'comment', 'add', '--help'],
            },
          },
        ]),
      },
    });
  });

  it('asks before a command that says so, unless --yes', async () => {
    const refused = await cli(['issue', 'delete', 'PM-1'], env);
    expect(refused.code).toBe(5);
    expect(refused.stderr).toContain('Pass --yes to go ahead');
    expect(server.seen).toEqual([]);
    const done = await cli(['issue', 'delete', 'PM-1', '--yes'], env);
    expect(done.code).toBe(0);
    expect(done.stdout).toBe('Done.\n');
    expect(server.seen[0]).toMatchObject({ method: 'DELETE' });
  });

  it('sends an optional ticket file’s name, so the route answers a ticket only when a file comes', async () => {
    writeFileSync(path.join(work, 'dist.tar.gz'), 'archive');
    const uploaded = await cli(
      ['deploy', '--file', 'dist.tar.gz', '--json'],
      env,
      { cwd: work },
    );
    expect(uploaded.code).toBe(0);
    expect(server.seen[0]).toMatchObject({
      path: '/api/deploys',
      json: { file: 'dist.tar.gz' },
    });
    expect(server.uploads[0]).toMatchObject({ text: 'archive' });
    const deployed = await cli(['deploy', '--release', 'r1', '--json'], env, {
      cwd: work,
    });
    expect(deployed.code).toBe(0);
    expect(server.seen[server.seen.length - 1]?.json).toEqual({
      release: 'r1',
    });
    expect(JSON.parse(deployed.stdout)).toMatchObject({
      result: { data: { deployed: 'r1' } },
    });
    expect(server.uploads).toHaveLength(1);
  });

  it('streams a ticket upload to the ticket, with the ticket’s credential and not the session’s', async () => {
    writeFileSync(path.join(work, 'dist.tar.gz'), 'archive');
    const result = await cli(
      [
        'release',
        'upload',
        'crm',
        '--file',
        'dist.tar.gz',
        '--deploy',
        '--json',
      ],
      env,
      { cwd: work },
    );
    expect(result.stderr).toBe('');
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'release upload',
      result: {
        data: { id: 'r1', version: '1.0.0' },
        meta: { message: 'Release r1: uploaded.' },
      },
    });
    // Without --json the upload's own answer is printed, not the ticket's.
    const said = await cli(
      ['release', 'upload', 'crm', '--file', 'dist.tar.gz'],
      env,
      { cwd: work },
    );
    expect(said.stdout.trim()).toBe('Release r1: uploaded.');
    expect(server.seen[0]).toMatchObject({
      method: 'POST',
      path: '/api/releases/apps/crm/uploadTickets',
      key: 'k1',
      json: { deploy: true },
    });
    expect(server.uploads[0]?.key).toBeUndefined();
    expect(server.uploads[0]).toEqual({
      authorization: 'Bearer ticket-1',
      type: 'application/gzip',
      disposition: "attachment; filename*=UTF-8''dist.tar.gz",
      text: 'archive',
    });
    const refused = await cli(
      ['release', 'upload', 'refused', '--file', 'dist.tar.gz'],
      env,
      { cwd: work },
    );
    expect(refused.code).toBe(3);
    expect(refused.stderr).toContain('TICKET_USED');
    const missing = await cli(['release', 'upload', 'crm'], env, {
      cwd: work,
    });
    expect(missing.code).toBe(5);
    expect(missing.stderr).toContain('needs --file <file>');
    writeFileSync(path.join(work, 'notes.txt'), 'x');
    const wrong = await cli(
      ['release', 'upload', 'crm', '--file', 'notes.txt'],
      env,
      { cwd: work },
    );
    expect(wrong.code).toBe(5);
    expect(wrong.stderr).toContain('is not one of .tar.gz');
  });

  it('sends the changed files of a mount as parts beside the fields, and JSON without --changed', async () => {
    const root = path.join(work, '.nocobase-runner', 'knowledge');
    mkdirSync(path.join(root, 'guides'), { recursive: true });
    writeFileSync(path.join(root, 'kept.md'), 'same');
    writeFileSync(path.join(root, 'guides', 'new.md'), 'line 1\nline 2');
    writeFileSync(path.join(root, 'skip.txt'), 'not markdown');
    writeFileSync(
      path.join(root, '.manifest.json'),
      JSON.stringify([
        {
          path: 'kept.md',
          hash: createHash('sha256').update('same').digest('hex'),
        },
      ]),
    );
    const sub = path.join(work, 'repo');
    mkdirSync(sub);
    const sent = await cli(
      ['kb', 'propose', '--changed', '--reason', 'Fix the guide', '--json'],
      env,
      { cwd: sub },
    );
    expect(sent.stderr).toBe('');
    expect(sent.code).toBe(0);
    expect(server.seen[0]).toMatchObject({
      path: '/api/knowledge/proposals',
      fields: { reason: 'Fix the guide' },
      files: [
        {
          field: 'files',
          name: 'guides/new.md',
          type: 'text/markdown',
          text: 'line 1\nline 2',
        },
      ],
    });
    const plain = await cli(['kb', 'propose', '--reason', 'Only words'], env, {
      cwd: sub,
    });
    expect(plain.code).toBe(0);
    expect(server.seen[1]).toMatchObject({ json: { reason: 'Only words' } });
    writeFileSync(path.join(root, 'kept.md'), 'changed');
    writeFileSync(path.join(root, 'third.md'), 'three');
    const many = await cli(['kb', 'propose', '--changed'], env, { cwd: sub });
    expect(many.code).toBe(5);
    expect(many.stderr).toContain('3 files changed');
  });

  it('saves a download under its own name, never overwriting, or where --out says', async () => {
    const first = await cli(
      ['issue', 'attachment', 'download', 'f1', '--json'],
      env,
      { cwd: work },
    );
    expect(first.stderr).toBe('');
    expect(JSON.parse(first.stdout).result.data).toEqual({
      path: path.join(work, '日志.txt'),
      filename: '日志.txt',
      mimeType: 'text/plain',
      size: 5,
    });
    expect(readFileSync(path.join(work, '日志.txt'), 'utf8')).toBe('hello');
    expect(server.seen[0]).toMatchObject({
      method: 'GET',
      path: '/api/projects/attachments/f1/content',
    });
    const second = await cli(['issue', 'attachment', 'download', 'f1'], env, {
      cwd: work,
    });
    expect(second.stdout).toContain(path.join(work, '日志 (2).txt'));
    mkdirSync(path.join(work, 'out'));
    await cli(['issue', 'attachment', 'download', 'f1', '--out', 'out'], env, {
      cwd: work,
    });
    await cli(
      ['issue', 'attachment', 'download', 'f1', '--out', 'x.log'],
      env,
      { cwd: work },
    );
    expect(readFileSync(path.join(work, 'out', '日志.txt'), 'utf8')).toBe(
      'hello',
    );
    expect(readFileSync(path.join(work, 'x.log'), 'utf8')).toBe('hello');
    const missing = await cli(
      ['issue', 'attachment', 'download', 'missing'],
      env,
      { cwd: work },
    );
    expect(missing.code).toBe(4);
    expect(missing.stderr).toContain('File not found.');
    const help = await cli(['issue', 'attachment', 'download', '--help'], env, {
      cwd: work,
    });
    expect(help.stdout).toContain('--out <path>');
  });

  it('exits 3 when refused, 4 for an unknown command and 5 for a missing flag', async () => {
    expect((await cli(['project', 'get', 'p1'], env)).code).toBe(3);
    const unknown = await cli(['issue', 'explode'], env);
    expect(unknown.code).toBe(4);
    expect(unknown.stderr).toContain('Unknown command: acme issue explode');
    const missing = await cli(['issue', 'comment', 'add', 'PM-1'], env);
    expect(missing.code).toBe(5);
    expect(missing.stderr).toContain(
      'needs --content (or --content-file <path>)',
    );
  });
});
