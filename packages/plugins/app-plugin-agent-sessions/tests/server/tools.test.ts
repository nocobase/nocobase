import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  createToolTokens,
  defineSessionTool,
  toolRoutes,
  TOOLS_PATH,
  type ToolHost,
} from '../../server/tools.js';

const tokens = createToolTokens(() => [
  { value: 'current' },
  { value: 'previous' },
]);

describe('tool tokens', () => {
  it('names the session it was signed for', () => {
    expect(tokens.verify(tokens.sign('session-1'))).toBe('session-1');
  });

  it('keeps accepting a token signed with a rotated key', () => {
    const old = createToolTokens(() => [{ value: 'previous' }]).sign(
      'session-1',
    );
    expect(tokens.verify(old)).toBe('session-1');
  });

  it('refuses a token signed elsewhere or for another session', () => {
    const foreign = createToolTokens(() => [{ value: 'elsewhere' }]).sign(
      'session-1',
    );
    const [, mac] = tokens.sign('session-1').split('.');
    expect(tokens.verify(foreign)).toBeUndefined();
    expect(tokens.verify(`session-2.${mac}`)).toBeUndefined();
    expect(tokens.verify('nonsense')).toBeUndefined();
  });
});

describe('the tools endpoint', () => {
  const link = vi.fn(() => Promise.resolve());
  const host: ToolHost = {
    serverName: 'studio',
    version: '1',
    tools: () => [
      defineSessionTool({
        name: 'add_task',
        description: 'Adds a task.',
        input: z.object({ title: z.string().min(1) }),
        run: async ({ title }, context) => {
          if (title === 'boom') throw new Error('The board is full.');
          await context.link('task', 'T-1');
          return {
            id: 'T-1',
            title,
            by: context.userId,
            project: context.projectId,
          };
        },
      }),
    ],
    caller: (token) =>
      Promise.resolve(
        tokens.verify(token) === 'session-1'
          ? { userId: 'u1', sessionId: 'session-1', projectId: 'p1' }
          : undefined,
      ),
    instructions: ({ projectId }) =>
      Promise.resolve(`This session works for ${projectId}.`),
    link,
  };
  const app = toolRoutes(host);
  const call = (body: unknown, token = tokens.sign('session-1')) =>
    app.request(TOOLS_PATH, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  const rpc = (id: number, method: string, params?: object) =>
    call({ jsonrpc: '2.0', id, method, params });

  it('refuses a caller without a valid token', async () => {
    const response = await call(
      { jsonrpc: '2.0', id: 1, method: 'ping' },
      tokens.sign('session-2'),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('agrees on a protocol version, says what the session works for and lists its tools', async () => {
    await expect(
      (await rpc(1, 'initialize', { protocolVersion: '2025-03-26' })).json(),
    ).resolves.toMatchObject({
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'studio' },
        instructions: 'This session works for p1.',
      },
    });
    await expect(
      (await rpc(2, 'initialize', { protocolVersion: '2099-01-01' })).json(),
    ).resolves.toMatchObject({
      result: { protocolVersion: '2025-06-18' },
    });
    await expect((await rpc(3, 'tools/list')).json()).resolves.toMatchObject({
      result: {
        tools: [
          {
            name: 'add_task',
            inputSchema: { type: 'object', required: ['title'] },
          },
        ],
      },
    });
  });

  it('runs a tool as the session’s owner and ties what it made to the session', async () => {
    const answer = await (
      await rpc(4, 'tools/call', {
        name: 'add_task',
        arguments: { title: 'Ship' },
      })
    ).json();
    expect(JSON.parse(answer.result.content[0].text)).toEqual({
      id: 'T-1',
      title: 'Ship',
      by: 'u1',
      project: 'p1',
    });
    expect(link).toHaveBeenCalledWith('session-1', 'task', 'T-1');
  });

  it('reports a failed or malformed call to the agent as a tool error', async () => {
    await expect(
      (
        await rpc(5, 'tools/call', {
          name: 'add_task',
          arguments: { title: 'boom' },
        })
      ).json(),
    ).resolves.toMatchObject({
      result: { isError: true, content: [{ text: 'The board is full.' }] },
    });
    await expect(
      (await rpc(6, 'tools/call', { name: 'add_task', arguments: {} })).json(),
    ).resolves.toMatchObject({
      result: { isError: true },
    });
    await expect(
      (await rpc(7, 'tools/call', { name: 'nope' })).json(),
    ).resolves.toMatchObject({
      error: { code: -32602 },
    });
  });

  it('takes notifications and batches as JSON-RPC does', async () => {
    expect(
      (await call({ jsonrpc: '2.0', method: 'notifications/initialized' }))
        .status,
    ).toBe(202);
    const batch = await call([
      { jsonrpc: '2.0', id: 1, method: 'ping' },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'resources/list' },
    ]);
    await expect(batch.json()).resolves.toEqual([
      { jsonrpc: '2.0', id: 1, result: {} },
      {
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32601,
          message: 'The method resources/list is not supported.',
        },
      },
    ]);
    expect((await app.request(TOOLS_PATH)).status).toBe(405);
  });
});
