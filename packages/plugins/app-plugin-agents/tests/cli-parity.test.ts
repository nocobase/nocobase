// @vitest-environment node
/**
 * The online shell's `acme` reads a line as the application's CLI does: each line below runs through the CLI a person
 * runs (its sources, against a server serving the same manifest) and through the online command, and both must send
 * the same request, or refuse the line the same way, and exit with the same code.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { CLI_ROUTES, HEADERS } from '@nocobase/agent-protocol';
import type { CliCommand, CliParameter } from '@nocobase/app-server/router';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { cliCommand, onlineTools } from '../server/online/index.js';

const issue: CliParameter = {
  name: 'issue',
  field: 'issueId',
  in: 'path',
  position: 0,
  type: 'string',
  required: true,
  description: 'The issue.',
};

const COMMANDS: CliCommand[] = [
  {
    id: 'issue:get',
    summary: 'Show an issue.',
    method: 'GET',
    path: '/api/issues/{issueId}',
    parameters: [
      issue,
      {
        name: 'expand',
        field: 'expand',
        in: 'query',
        type: 'string',
        required: false,
      },
      {
        name: 'limit',
        field: 'pageSize',
        in: 'query',
        type: 'integer',
        required: false,
        default: 20,
      },
    ],
    output: { kind: 'data' },
    identities: ['run'],
  },
  {
    id: 'issue:search',
    summary: 'Find issues.',
    method: 'GET',
    path: '/api/issues',
    parameters: [
      {
        name: 'tag',
        field: 'tags',
        in: 'query',
        type: 'string[]',
        required: false,
      },
      {
        name: 'score',
        field: 'scores',
        in: 'query',
        type: 'number[]',
        required: false,
      },
      {
        name: 'state',
        field: 'state',
        in: 'query',
        type: 'string',
        required: false,
        enum: ['open', 'closed'],
      },
      {
        name: 'all',
        field: 'all',
        in: 'query',
        type: 'boolean',
        required: false,
      },
    ],
    output: { kind: 'list' },
    identities: ['run'],
  },
  {
    id: 'issue:update',
    summary: 'Change an issue.',
    method: 'PATCH',
    path: '/api/issues/{issueId}',
    parameters: [
      issue,
      {
        name: 'title',
        field: 'title',
        in: 'body',
        type: 'string',
        required: false,
        contentFile: true,
      },
      {
        name: 'labels',
        field: 'labels',
        in: 'body',
        type: 'string[]',
        required: false,
      },
      {
        name: 'meta',
        field: 'meta',
        in: 'body',
        type: 'json',
        required: false,
        contentFile: true,
      },
      {
        name: 'notify',
        field: 'notify',
        in: 'body',
        type: 'boolean',
        required: false,
        alias: 'n',
      },
      {
        name: 'points',
        field: 'points',
        in: 'body',
        type: 'integer',
        required: false,
      },
    ],
    body: { media: 'application/json', file: 'file' },
    output: { kind: 'data' },
    identities: ['run'],
  },
  {
    id: 'issue:create',
    summary: 'Open an issue.',
    method: 'POST',
    path: '/api/issues',
    parameters: [
      {
        name: 'title',
        field: 'title',
        in: 'body',
        type: 'string',
        required: true,
        description: 'The title.',
        contentFile: true,
      },
      {
        name: 'project',
        field: 'projectId',
        in: 'body',
        type: 'string',
        required: true,
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['run'],
  },
  {
    id: 'app:env:set',
    summary: 'Set a variable.',
    method: 'PUT',
    path: '/api/apps/{appId}/variables/{name}',
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
        name: 'name',
        field: 'name',
        in: 'path',
        position: 1,
        type: 'string',
        required: true,
      },
      {
        name: 'value',
        field: 'value',
        in: 'body',
        position: 2,
        type: 'string',
        required: true,
        fromEnv: 'name',
      },
    ],
    body: { media: 'application/json' },
    output: { kind: 'data' },
    identities: ['run'],
  },
  {
    id: 'plan:create',
    summary: 'Propose a plan.',
    method: 'POST',
    path: '/api/plans',
    parameters: [],
    body: { media: 'application/json', file: 'file', required: true },
    output: { kind: 'data' },
    identities: ['run'],
  },
];

interface Case {
  readonly name: string;
  readonly argv: readonly string[];
  /** Files in the working directory, by name. */
  readonly files?: Readonly<Record<string, string>>;
  /** Variables of the environment. */
  readonly env?: Readonly<Record<string, string>>;
}

const CASES: Case[] = [
  { name: 'a positional argument', argv: ['issue', 'get', 'PM-1'] },
  {
    name: 'an encoded path, a query flag with =, and an integer',
    argv: ['issue', 'get', 'PM 1', '--expand=comments', '--limit', '5'],
  },
  {
    name: 'a positional after --',
    argv: ['issue', 'get', '--', '-weird'],
  },
  {
    name: 'a number that is not whole',
    argv: ['issue', 'get', 'PM-1', '--limit', '1.5'],
  },
  {
    name: 'a number that is not one',
    argv: ['issue', 'get', 'PM-1', '--limit', 'x'],
  },
  { name: 'too many arguments', argv: ['issue', 'get', 'PM-1', 'PM-2'] },
  { name: 'an unknown flag', argv: ['issue', 'get', 'PM-1', '--nope'] },
  { name: 'a missing argument', argv: ['issue', 'get'] },
  {
    name: 'a flag without its value',
    argv: ['issue', 'get', 'PM-1', '--expand'],
  },
  {
    name: 'repeated array flags, an enum and a boolean',
    argv: [
      'issue',
      'search',
      '--tag',
      'a',
      '--tag',
      'b',
      '--score',
      '1',
      '--score=2.5',
      '--state',
      'open',
      '--all',
    ],
  },
  {
    name: 'a value outside the enum',
    argv: ['issue', 'search', '--state', 'x'],
  },
  { name: 'a boolean set to false', argv: ['issue', 'search', '--all=false'] },
  { name: 'a negated boolean', argv: ['issue', 'search', '--no-all'] },
  {
    name: 'a boolean that is neither',
    argv: ['issue', 'search', '--all=maybe'],
  },
  {
    name: 'an array, key=value pairs, an alias and an integer in the body',
    argv: [
      'issue',
      'update',
      'PM-1',
      '--labels',
      'x',
      '--labels',
      'y',
      '--meta',
      'a=1',
      '--meta',
      'b=2',
      '-n',
      '--points',
      '3',
    ],
  },
  {
    name: 'a JSON value',
    argv: ['issue', 'update', 'PM-1', '--meta', '{"k":[1,2]}'],
  },
  {
    name: 'values read from files, one parsed as JSON',
    argv: [
      'issue',
      'update',
      'PM-1',
      '--title-file',
      'title.md',
      '--meta-file',
      'meta.json',
    ],
    files: { 'title.md': 'Line one\nLine two', 'meta.json': '{"a":{"b":1}}' },
  },
  {
    name: 'a JSON file that is not JSON',
    argv: ['issue', 'update', 'PM-1', '--meta-file', 'meta.json'],
    files: { 'meta.json': 'not json' },
  },
  {
    name: 'a value and its file both',
    argv: [
      'issue',
      'update',
      'PM-1',
      '--title',
      'T',
      '--title-file',
      'title.md',
    ],
    files: { 'title.md': 'T2' },
  },
  {
    name: 'a file that is not there',
    argv: ['issue', 'update', 'PM-1', '--title-file', 'gone.md'],
  },
  {
    name: 'a body file the flags override',
    argv: ['issue', 'update', 'PM-1', '--file', 'body.json', '--points', '4'],
    files: { 'body.json': '{"title":"From the file","points":1}' },
  },
  {
    name: 'a body file that is not an object',
    argv: ['issue', 'update', 'PM-1', '--file', 'body.json'],
    files: { 'body.json': '[1]' },
  },
  {
    name: 'a body file that is not JSON',
    argv: ['issue', 'update', 'PM-1', '--file', 'body.json'],
    files: { 'body.json': '{' },
  },
  { name: 'missing required flags', argv: ['issue', 'create'] },
  {
    name: 'required flags given',
    argv: ['issue', 'create', '--title', 'Hello', '--project', 'p1'],
  },
  {
    name: '--from-env',
    argv: ['app', 'env', 'set', 'crm', 'SECRET_X', '--from-env'],
    env: { SECRET_X: 's3cret value' },
  },
  {
    name: '--from-env with the variable unset',
    argv: ['app', 'env', 'set', 'crm', 'SECRET_UNSET', '--from-env'],
  },
  {
    name: '--from-env and a value both',
    argv: ['app', 'env', 'set', 'crm', 'SECRET_X', 'v', '--from-env'],
    env: { SECRET_X: 's3cret' },
  },
  {
    name: '--from-env without the name',
    argv: ['app', 'env', 'set', 'crm', '--from-env'],
  },
  { name: 'a required body file left out', argv: ['plan', 'create'] },
  {
    name: 'a required body file',
    argv: ['plan', 'create', '--file', 'plan.json'],
    files: { 'plan.json': '{"steps":[]}' },
  },
  { name: 'a missing record', argv: ['issue', 'get', 'missing'] },
  { name: 'a refusal', argv: ['issue', 'get', 'forbidden'] },
  {
    name: 'a server failure without the error body',
    argv: ['issue', 'get', 'broken'],
  },
];

/** The line, with `--json` right after the command's words when asked for, where no flag can take it as its value. */
function lineOf(entry: Case, json: boolean): string[] {
  if (!json) return [...entry.argv];
  const words = Math.max(
    ...COMMANDS.map((command) => command.id.split(':')).map((id) =>
      id.every((word, at) => entry.argv[at] === word) ? id.length : 0,
    ),
  );
  return [...entry.argv.slice(0, words), '--json', ...entry.argv.slice(words)];
}

interface Seen {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
}

const standardError = (code: number, status: string, reason: string) => ({
  error: { code, status, reason, domain: 'issues', message: `${reason}.` },
});

/** What the application answers a command's request, the same to both. */
function answer(seen: Seen): { status: number; body: string } {
  if (seen.path.startsWith('/api/issues/missing'))
    return {
      status: 404,
      body: JSON.stringify(standardError(404, 'NOT_FOUND', 'ISSUE_NOT_FOUND')),
    };
  if (seen.path.startsWith('/api/issues/forbidden'))
    return {
      status: 403,
      body: JSON.stringify(
        standardError(403, 'PERMISSION_DENIED', 'FORBIDDEN'),
      ),
    };
  if (seen.path.startsWith('/api/issues/broken'))
    return { status: 500, body: 'Internal Server Error' };
  return {
    status: 200,
    body: JSON.stringify({ data: { ok: true }, meta: { message: 'Done.' } }),
  };
}

const ACME = path.join(import.meta.dirname, 'fixtures', 'acme-cli.mjs');

interface Outcome {
  readonly exit: number;
  readonly envelope: unknown;
  readonly requests: readonly Seen[];
}

/** The CLI a person runs, inside a run's working directory, with a server that serves the manifest. */
class RealCli {
  private server?: Server;
  private url = '';
  private seen = new Map<string, Seen[]>();
  private readonly root = mkdtempSync(path.join(os.tmpdir(), 'acme-parity-'));

  async start(): Promise<void> {
    this.server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        const url = request.url ?? '/';
        if (url.startsWith(CLI_ROUTES.manifest)) {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({
              data: {
                version: 4,
                etag: 'parity',
                identity: {
                  kind: 'run',
                  userId: 'u1',
                  displayName: 'Coder',
                  runId: 'r1',
                  actions: [],
                },
                commands: COMMANDS,
              },
            }),
          );
          return;
        }
        const text = Buffer.concat(chunks).toString('utf8');
        const seen: Seen = {
          method: request.method ?? 'GET',
          path: url,
          ...(text === '' ? {} : { body: JSON.parse(text) as unknown }),
        };
        const run = String(request.headers[HEADERS.runToken] ?? '');
        this.seen.set(run, [...(this.seen.get(run) ?? []), seen]);
        const { status, body } = answer(seen);
        response.writeHead(status, {
          'content-type': status === 500 ? 'text/plain' : 'application/json',
        });
        response.end(body);
      });
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
    this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  async stop(): Promise<void> {
    await new Promise((resolve) => this.server?.close(resolve));
    rmSync(this.root, { recursive: true, force: true });
  }

  /** Runs the line in a working directory of its own, whose run token tells its requests apart. */
  async run(index: number, entry: Case, json: boolean): Promise<Outcome> {
    const token = `case-${index}-${json ? 'json' : 'text'}`;
    const work = path.join(this.root, token);
    mkdirSync(path.join(work, '.acme'), { recursive: true });
    writeFileSync(
      path.join(work, '.acme', 'run.json'),
      JSON.stringify({
        server: this.url,
        token,
        runId: 'r1',
        manifestUrl: CLI_ROUTES.manifest,
        expiresAt: '2099-01-01T00:00:00.000Z',
      }),
    );
    for (const [name, content] of Object.entries(entry.files ?? {}))
      writeFileSync(path.join(work, name), content);
    const home = path.join(work, 'home');
    const { stdout, code } = await new Promise<{
      stdout: string;
      code: number | null;
    }>((resolve) => {
      const child = spawn(process.execPath, [ACME, ...lineOf(entry, json)], {
        cwd: work,
        env: {
          PATH: process.env.PATH,
          ACME_HOME: home,
          ACME_KEYCHAIN: 'off',
          NO_COLOR: '1',
          ...entry.env,
        },
      });
      let out = '';
      child.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()));
      child.stdin.end();
      child.on('close', (exit) => resolve({ stdout: out, code: exit }));
    });
    return {
      exit: code ?? -1,
      envelope: json ? (JSON.parse(stdout) as unknown) : undefined,
      requests: this.seen.get(token) ?? [],
    };
  }
}

/** Runs at most `limit` of the tasks at once. */
function limited(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
  let running = 0;
  const waiting: (() => void)[] = [];
  return async (task) => {
    if (running >= limit)
      await new Promise<void>((resolve) => waiting.push(resolve));
    running += 1;
    try {
      return await task();
    } finally {
      running -= 1;
      waiting.shift()?.();
    }
  };
}

const quote = (word: string): string => `'${word.replaceAll("'", `'\\''`)}'`;

/** The online shell's `acme`, its files written and its variables exported first. */
async function runOnline(entry: Case, json: boolean): Promise<Outcome> {
  const requests: Seen[] = [];
  const [bash] = onlineTools(
    [],
    [
      cliCommand({
        bin: 'acme',
        commands: COMMANDS,
        send: (request) => {
          const seen: Seen = {
            method: request.method,
            path: request.path,
            ...(typeof request.body === 'string'
              ? { body: JSON.parse(request.body) as unknown }
              : {}),
          };
          requests.push(seen);
          const { status, body } = answer(seen);
          return Promise.resolve(new Response(body, { status }));
        },
      }),
    ],
  );
  const setup = [
    ...Object.entries(entry.files ?? {}).map(
      ([name, content]) => `printf '%s' ${quote(content)} > /tmp/${name}`,
    ),
    ...Object.entries(entry.env ?? {}).map(
      ([name, value]) => `export ${name}=${quote(value)}`,
    ),
  ];
  const line = [
    ...setup,
    ['acme', ...lineOf(entry, json)].map(quote).join(' '),
  ].join('; ');
  const { output } = await bash!.invoke({ command: line });
  const [first = '', ...rest] = output.split('\n');
  const stdout = rest.join('\n').split('\n[stderr]')[0]!;
  return {
    exit: Number(/^exit code (\d+)$/u.exec(first)?.[1] ?? -1),
    envelope: json ? (JSON.parse(stdout) as unknown) : undefined,
    requests,
  };
}

describe('acme in an online shell and on a machine', () => {
  const real = new RealCli();
  beforeAll(() => real.start());
  afterAll(() => real.stop());

  // Each line both ways; a few of the real CLI's processes at a time.
  const slot = limited(Math.max(2, Math.min(8, os.availableParallelism() - 1)));
  const outcomes = new Map<
    string,
    Promise<{ real: Outcome; online: Outcome }>
  >();
  const outcome = (index: number, json: boolean) => {
    const key = `${index}:${json}`;
    if (!outcomes.has(key))
      outcomes.set(
        key,
        Promise.all([
          slot(() => real.run(index, CASES[index]!, json)),
          runOnline(CASES[index]!, json),
        ]).then(([real, online]) => ({ real, online })),
      );
    return outcomes.get(key)!;
  };
  beforeAll(() => {
    CASES.forEach((_, index) => {
      void outcome(index, true);
      void outcome(index, false);
    });
  });

  it.each(CASES.map((entry, index) => [entry.name, index] as const))(
    '%s: the same request or refusal, and exit code',
    async (_name, index) => {
      const { real, online } = await outcome(index, true);
      expect(online.envelope).toEqual(real.envelope);
      expect(online.exit).toBe(real.exit);
      expect(online.requests).toEqual(real.requests);
      const text = await outcome(index, false);
      expect(text.online.exit).toBe(text.real.exit);
      expect(text.online.requests).toEqual(text.real.requests);
    },
    60_000,
  );

  it('reads each kind of value as the CLI documents', async () => {
    const at = (name: string) =>
      CASES.findIndex((entry) => entry.name === name);
    const request = async (name: string) =>
      (await outcome(at(name), true)).online.requests[0];
    expect(
      await request('an encoded path, a query flag with =, and an integer'),
    ).toEqual({
      method: 'GET',
      path: '/api/issues/PM%201?expand=comments&pageSize=5',
    });
    expect(
      await request('repeated array flags, an enum and a boolean'),
    ).toEqual({
      method: 'GET',
      path: '/api/issues?tags=a&tags=b&scores=1&scores=2.5&state=open&all=true',
    });
    expect(
      (
        await request(
          'an array, key=value pairs, an alias and an integer in the body',
        )
      )?.body,
    ).toEqual({
      labels: ['x', 'y'],
      meta: { a: '1', b: '2' },
      notify: true,
      points: 3,
    });
    expect(
      (await request('values read from files, one parsed as JSON'))?.body,
    ).toEqual({ title: 'Line one\nLine two', meta: { a: { b: 1 } } });
    expect((await request('a body file the flags override'))?.body).toEqual({
      title: 'From the file',
      points: 4,
    });
    expect((await request('--from-env'))?.body).toEqual({
      value: 's3cret value',
    });
    const refused = await outcome(at('missing required flags'), true);
    expect(refused.online.exit).toBe(5);
    expect(refused.online.envelope).toMatchObject({
      ok: false,
      error: {
        code: 'MISSING_ARGUMENT',
        details: { missing: ['title', 'project'] },
      },
    });
    expect((await outcome(at('a refusal'), true)).online.exit).toBe(3);
    expect(
      (await outcome(at('a server failure without the error body'), true))
        .online.exit,
    ).toBe(2);
  });
});
