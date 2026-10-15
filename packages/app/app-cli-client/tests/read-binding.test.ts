import { beforeAll, describe, expect, it } from 'vitest';
import { configureAppCli } from '../src/config.ts';
import { CliCommandSchema } from '../src/dynamic/manifest.ts';
import { executeRest, parseRestCall } from '../src/dynamic/rest.ts';
import type { Session } from '../src/dynamic/session.ts';
import { TEST_CLI } from './helpers.ts';

beforeAll(() => configureAppCli(TEST_CLI));
const command = CliCommandSchema.parse({
  id: 'issue:handoff:accept',
  summary: 'Accept',
  method: 'POST',
  path: '/main/api/handoffs/{issueId}/accept',
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
  body: { media: 'application/json', required: true },
  output: { kind: 'data' },
  identities: ['person'],
  readBinding: {
    path: '/main/api/handoffs/{id}',
    params: { id: 'issueId' },
    responseField: 'data.handoff.notificationKey',
    bodyField: 'notificationKey',
  },
});
const session: Session = {
  kind: 'user',
  server: 'https://example.com/main',
  headers: { 'x-api-key': 'test-key' },
  manifestPath: '/main/api/cli/manifest',
  cacheKey: 'test',
};

describe('a read binding', () => {
  it('reads once with the same session, encodes the mapped issue and sends the exact key', async () => {
    const seen: { url: string; method: string | undefined; body: unknown }[] =
      [];
    const call = await parseRestCall(command, ['PM /1']);
    const fetcher: typeof fetch = async (url, init) => {
      seen.push({ url: String(url), method: init?.method, body: init?.body });
      expect(new Headers(init?.headers).get('x-api-key')).toBe('test-key');
      return Response.json({
        data:
          init?.method === 'GET'
            ? { handoff: { notificationKey: 'exact-key' } }
            : { accepted: true },
      });
    };
    expect(
      await executeRest(session, command, call, { fetch: fetcher }),
    ).toEqual({ data: { accepted: true } });
    expect(seen).toEqual([
      {
        url: 'https://example.com/main/api/handoffs/PM%20%2F1',
        method: 'GET',
        body: undefined,
      },
      {
        url: 'https://example.com/main/api/handoffs/PM%20%2F1/accept',
        method: 'POST',
        body: '{"notificationKey":"exact-key"}',
      },
    ]);
  });
  it.each([null, {}, { notificationKey: '' }])(
    'stops on a missing current value (%j)',
    async (handoff) => {
      let reads = 0;
      await expect(
        executeRest(session, command, await parseRestCall(command, ['PM-1']), {
          fetch: async () => {
            reads++;
            return Response.json({ data: { handoff } });
          },
        }),
      ).rejects.toMatchObject({
        code: 'READ_BINDING_MISSING',
        message: expect.stringContaining('missing or expired'),
      });
      expect(reads).toBe(1);
    },
  );
  it.each([403, 409])(
    'passes through HTTP %i without rereading or retrying',
    async (status) => {
      const methods: (string | undefined)[] = [];
      await expect(
        executeRest(session, command, await parseRestCall(command, ['PM-1']), {
          fetch: async (_url, init) => {
            methods.push(init?.method);
            if (status === 409 && methods.length === 1)
              return Response.json({
                data: { handoff: { notificationKey: 'old-key' } },
              });
            return Response.json(
              {
                error: {
                  code: status,
                  status: status === 409 ? 'ABORTED' : 'PERMISSION_DENIED',
                  reason:
                    status === 409
                      ? 'ISSUE_OWNER_HANDOFF_STALE'
                      : 'ACTION_FORBIDDEN',
                  domain: 'studio',
                  message: 'Refresh the issue.',
                },
              },
              { status },
            );
          },
        }),
      ).rejects.toMatchObject({
        reason:
          status === 409 ? 'ISSUE_OWNER_HANDOFF_STALE' : 'ACTION_FORBIDDEN',
      });
      expect(methods).toEqual(status === 409 ? ['GET', 'POST'] : ['GET']);
    },
  );
});
