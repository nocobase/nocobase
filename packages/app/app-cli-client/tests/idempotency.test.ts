import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { configureAppCli, appCliPaths } from '../src/config.ts';
import {
  CliCommandSchema,
  CliManifestSchema,
  manifestCacheFile,
} from '../src/dynamic/manifest.ts';
import { executeRest, parseRestCall } from '../src/dynamic/rest.ts';
import { renderCommandHelp } from '../src/dynamic/output.ts';
import { fillRequest } from '../src/request.ts';
import { parseCommandLine } from '../src/parse/arguments.ts';
import { failureEnvelope, successEnvelope } from '../src/lib/envelope.ts';
import { send } from '../src/dynamic/execute.ts';
import { TEST_CLI } from './helpers.ts';
import type { Session } from '../src/dynamic/session.ts';

beforeAll(() => configureAppCli(TEST_CLI));
const command = CliCommandSchema.parse({
  id: 'record:create',
  summary: 'Create a record',
  method: 'POST',
  path: '/main/api/records',
  parameters: [
    {
      name: 'value',
      field: 'value',
      in: 'body',
      type: 'string',
      required: true,
    },
  ],
  body: { media: 'application/json' },
  output: { kind: 'data' },
  identities: ['person'],
  idempotency: {
    header: 'idempotency-key',
    flag: 'operation-key',
    minLength: 1,
    maxLength: 100,
  },
  requiredCapabilities: ['idempotency-v1'],
});
const session: Session = {
  kind: 'user',
  server: 'https://example.com/main',
  headers: { authorization: 'Bearer private-test-value' },
  manifestPath: '/main/api/cli/manifest',
  cacheKey: 'person',
};
const io = { readText: async () => undefined, env: () => undefined };
const explicit = 'original-key';

describe('dedicated operation keys', () => {
  it('generates once, prints to stderr before sending and keeps the same key in the success envelope', async () => {
    let key: string | null = null;
    const stderr: string[] = [];
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      key = new Headers(init?.headers).get('idempotency-key');
      expect(key).toMatch(
        /^\d{13}\.[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u,
      );
      expect(key).toHaveLength(50);
      expect(stderr).toEqual([`Operation key: ${key}\n`]);
      expect(new Headers(init?.headers).get('authorization')).toBe(
        session.headers.authorization,
      );
      expect(init?.redirect).toBe('error');
      return Response.json({ data: { id: 'operation-id' } });
    });
    const result = await executeRest(
      session,
      command,
      await parseRestCall(command, ['--value', 'secret-body']),
      { fetch: fetcher, stderr: (line) => stderr.push(line) },
    );
    expect(result).toEqual({
      data: { id: 'operation-id' },
      meta: { operationKey: key, requestStatus: 'responded' },
    });
    expect(
      JSON.stringify(successEnvelope('record create', result)),
    ).not.toContain('secret-body');
    expect(stderr.join('')).not.toContain('secret-body');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('accepts exact 50-character bounds for generated and explicit native keys', async () => {
    const exact = CliCommandSchema.parse({
      ...command,
      idempotency: { ...command.idempotency, minLength: 50, maxLength: 50 },
    });
    const explicit = `${Date.now()}.00000000-0000-4000-8000-000000000001`;
    for (const args of [[], ['--operation-key', explicit]]) {
      const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
        const key = new Headers(init?.headers).get('idempotency-key');
        expect(key).toHaveLength(50);
        if (args.length) expect(key).toBe(explicit);
        return Response.json({ data: 'ok' });
      });
      await executeRest(
        session,
        exact,
        await parseRestCall(exact, ['--value', 'A', ...args]),
        { fetch: fetcher, stderr: () => undefined },
      );
      expect(fetcher).toHaveBeenCalledOnce();
    }
    expect(renderCommandHelp(exact)).toContain('24 hours');
  });

  it('preserves an explicit key and does not send it in the URL or body', async () => {
    const call = await parseRestCall(command, [
      '--value',
      'A',
      `--operation-key=${explicit}`,
    ]);
    const filled = fillRequest(
      command,
      call.values,
      call.bodyFile,
      call.operationKey,
    );
    expect(filled).toEqual({
      method: 'POST',
      path: '/main/api/records',
      fields: { value: 'A' },
      headers: { 'idempotency-key': explicit },
    });
    expect(() => fillRequest(command, call.values)).toThrow(
      'requires operation-key support',
    );
  });

  it.each([
    '',
    'a\rb',
    'a\nb',
    'a\u0000b',
    'a\u007fb',
    'a\u0080b',
    ' leading',
    'trailing ',
    'a'.repeat(101),
  ])('rejects unsafe explicit values without echoing them', async (value) => {
    await expect(
      parseRestCall(command, ['--value', 'A', '--operation-key', value]),
    ).rejects.toThrow('Invalid --operation-key');
  });

  it('refuses duplicates, timestamp.UUID-incompatible constraints, unknown semantics, flags and auth headers', async () => {
    await expect(
      parseRestCall(command, [
        '--value',
        'A',
        '--operation-key',
        'one',
        '--operation-key',
        'two',
      ]),
    ).rejects.toThrow('only be specified once');
    for (const changes of [
      { idempotency: { ...command.idempotency, header: 'Authorization' } },
      { idempotency: { ...command.idempotency, minLength: 51 } },
      { idempotency: { ...command.idempotency, flag: 'other' } },
      { idempotency: { ...command.idempotency, maxLength: 49 } },
      { idempotency: { ...command.idempotency, format: 'uuid' } },
      { idempotency: { ...command.idempotency, future: true } },
      { requiredCapabilities: ['future-v2'] },
      { requiredCapabilities: undefined },
      { method: 'GET' },
      { parameters: [{ ...command.parameters[0], name: 'operation-key' }] },
      { body: { media: 'application/json', file: 'OPERATION-KEY' } },
      {
        readBinding: {
          path: '/api/read',
          params: {},
          responseField: 'data.id',
          bodyField: 'revision',
        },
      },
      { parameters: [{ ...command.parameters[0], ticket: { maxBytes: 100 } }] },
    ])
      expect(
        CliCommandSchema.safeParse({ ...command, ...changes }).success,
      ).toBe(false);
    const call = await parseRestCall(command, ['--value', 'A']);
    const fetcher = vi.fn();
    await expect(
      executeRest(
        { ...session, headers: { 'IDEMPOTENCY-KEY': 'already-set' } },
        command,
        call,
        { fetch: fetcher },
      ),
    ).rejects.toMatchObject({
      code: 'OPERATION_HEADER_CONFLICT',
      details: { requestStatus: 'not-sent' },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not generate or send on help, failed file validation, confirmation refusal or dry run', async () => {
    const fetcher = vi.fn();
    const stderr = vi.fn();
    expect((await parseRestCall(command, ['--help'])).help).toBe(true);
    expect(renderCommandHelp(command)).toContain('--operation-key');
    const fileCommand = {
      ...command,
      parameters: [{ ...command.parameters[0], binary: true }],
    };
    await expect(
      parseRestCall(fileCommand, ['--value', '/definitely-missing-file']),
    ).rejects.toThrow('not a file');
    await expect(
      executeRest(
        session,
        { ...command, confirm: 'Create?' },
        await parseRestCall(command, ['--value', 'A']),
        { fetch: fetcher, stderr },
      ),
    ).rejects.toMatchObject({
      code: 'CONFIRMATION_REQUIRED',
      details: { requestStatus: 'not-sent' },
    });
    const call = await parseCommandLine(command, ['--value', 'A'], {
      bin: 'acme',
      io,
      dryRun: true,
    });
    const answer = await executeRest(session, command, call, {
      fetch: fetcher,
      stderr,
    });
    expect(answer).toMatchObject({ meta: { requestStatus: 'not-sent' } });
    expect(answer.meta).not.toHaveProperty('operationKey');
    expect(fetcher).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
  });

  it.each([
    'network',
    'timeout',
    'cancel',
    'read',
    'json',
    'empty',
    'conflict',
  ] as const)(
    'retains the original key after %s and never replays the write',
    async (mode) => {
      const fetcher = vi.fn<typeof fetch>(async () => {
        if (mode === 'network' || mode === 'timeout' || mode === 'cancel')
          throw new Error(mode);
        if (mode === 'read')
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new Error('read failed'));
              },
            }),
          );
        if (mode === 'json') return new Response('invalid-json');
        if (mode === 'empty') return new Response('');
        return Response.json(
          {
            error: {
              code: 409,
              status: 'ALREADY_EXISTS',
              reason: 'KEY_CONFLICT',
              domain: 'records',
              message: 'Changed input.',
            },
          },
          { status: 409 },
        );
      });
      const call = await parseRestCall(command, [
        '--value',
        'private-body',
        '--operation-key',
        explicit,
      ]);
      const error = await executeRest(session, command, call, {
        fetch: fetcher,
        stderr: () => undefined,
      }).catch((error: unknown) => error);
      const envelope = failureEnvelope('record create', error);
      expect(envelope).toMatchObject({
        ok: false,
        error: {
          code:
            mode === 'conflict'
              ? 'KEY_CONFLICT'
              : mode === 'read'
                ? 'RESPONSE_READ_FAILED'
                : mode === 'json' || mode === 'empty'
                  ? 'UNEXPECTED_RESPONSE'
                  : 'NETWORK',
          details: {
            operationKey: explicit,
            requestStatus: mode === 'conflict' ? 'responded' : 'unknown',
          },
        },
      });
      expect(JSON.stringify(envelope)).not.toContain('private-body');
      expect(JSON.stringify(envelope)).toContain('Query its status');
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it('checks abort before submission and preserves a valid explicit key', async () => {
    const fetcher = vi.fn();
    const call = await parseRestCall(command, [
      '--value',
      'A',
      '--operation-key',
      explicit,
    ]);
    await expect(
      executeRest(session, command, call, {
        fetch: fetcher,
        signal: AbortSignal.abort(),
        stderr: () => undefined,
      }),
    ).rejects.toMatchObject({
      details: { operationKey: explicit, requestStatus: 'not-sent' },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('separates capability caches and refuses unnegotiated or unknown semantics, including offline data', () => {
    const paths = appCliPaths('/synthetic-home');
    const old = createHash('sha256')
      .update(`${session.server}\u0000${session.cacheKey}`)
      .digest('hex')
      .slice(0, 24);
    expect(manifestCacheFile(paths, session)).not.toContain(old);
    const manifest = {
      version: 4,
      etag: 'test',
      identity: { kind: 'person', userId: 'u1', displayName: 'Ada' },
      commands: [command],
    };
    expect(CliManifestSchema.safeParse(manifest).success).toBe(false);
    expect(
      CliManifestSchema.safeParse({
        ...manifest,
        capabilities: ['idempotency-v1'],
      }).success,
    ).toBe(true);
    expect(
      CliManifestSchema.safeParse({ ...manifest, capabilities: ['future-v2'] })
        .success,
    ).toBe(false);
    expect(
      CliManifestSchema.safeParse({
        ...manifest,
        commands: [
          {
            ...command,
            idempotency: undefined,
            requiredCapabilities: undefined,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('keeps ordinary JSON response behavior unchanged', async () => {
    expect(
      await send(
        new URL('https://example.com/api/plain'),
        { method: 'POST' },
        { fetch: async () => new Response('') },
      ),
    ).toBeUndefined();
  });
});
