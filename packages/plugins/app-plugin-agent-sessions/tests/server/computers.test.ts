import { createHash } from 'node:crypto';

import type {
  BridgeCommand,
  RegisterRequest,
} from '@nocobase/acp-bridge/protocol';
import type { DatabaseManager } from '@nocobase/db';
import { describe, expect } from 'vitest';

import { AgentSessionsService } from '../../server/service.js';
import { computers } from '../../server/store.js';
import { test } from '../helpers/database.js';

const owner = { userId: 'u1', locale: 'en-US' };
const signal = new AbortController().signal;

function setup(database: DatabaseManager) {
  const service = new AgentSessionsService({ database });
  const request = (
    overrides: Partial<RegisterRequest> = {},
    computer: Partial<RegisterRequest['computer']> = {},
  ): RegisterRequest => ({
    protocol: 1,
    computerId: null,
    bridgeStartedAt: 'bridge-1',
    ...overrides,
    computer: {
      name: 'Laptop',
      platform: 'darwin',
      arch: 'arm64',
      host: 'nb-studio 1.0.0',
      home: '/home/zhou',
      roots: ['/home/zhou'],
      agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
      ...computer,
    },
  });
  const take = async (computerId: string): Promise<BridgeCommand[]> =>
    (await service.poll('u1', { computerId, wait: false }, signal)).commands;
  return { service, request, take };
}

describe('a computer’s key', () => {
  test('is given to its owner signed in, and kept only as a hash', async ({
    database,
  }) => {
    const { service, request } = setup(database);
    const { computerId, key } = await service.register('u1', request());
    expect(key).toMatch(/^nbc_[\w-]{43}$/u);

    const stored = await computers(database.connection()).findOne({
      filter: { id: computerId },
    });
    expect(stored?.keyHash).toBe(
      createHash('sha256').update(key!).digest('hex'),
    );
    expect(JSON.stringify(stored)).not.toContain(key!);
    await expect(service.computerOfKey(key!)).resolves.toEqual({
      id: computerId,
      userId: 'u1',
    });
    await expect(service.computerOfKey('nbc_unknown')).resolves.toBeUndefined();
  });

  test('registers its computer again and stays valid, for that computer only', async ({
    database,
  }) => {
    const { service, request } = setup(database);
    const { computerId, key } = await service.register('u1', request());
    await expect(
      service.register('u1', request({ computerId }), true),
    ).resolves.toEqual({ computerId });
    await expect(service.computerOfKey(key!)).resolves.toMatchObject({
      id: computerId,
    });
    await expect(
      service.register('u1', request({ computerId: 'another' }), true),
    ).rejects.toMatchObject({ key: 'computerNotFound' });
  });

  test('stops working once the computer is removed or its owner registers it again', async ({
    database,
  }) => {
    const { service, request } = setup(database);
    const first = await service.register('u1', request());
    const second = await service.register(
      'u1',
      request({ computerId: first.computerId }),
    );
    await expect(service.computerOfKey(first.key!)).resolves.toBeUndefined();
    await service.removeComputer('u1', first.computerId);
    await expect(service.computerOfKey(second.key!)).resolves.toBeUndefined();
  });
});

describe('a Windows computer', () => {
  test('lets sessions work under its folders as Windows writes them', async ({
    database,
  }) => {
    const { service, request, take } = setup(database);
    const { computerId } = await service.register(
      'u1',
      request(
        {},
        {
          platform: 'win32',
          home: 'C:\\Users\\Me',
          roots: ['C:\\Users\\Me'],
        },
      ),
    );
    await expect(
      service.updateComputer('u1', computerId, { folders: ['D:\\code'] }),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    await expect(
      service.updateComputer('u1', computerId, { folders: ['code'] }),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    await expect(
      service.updateComputer('u1', computerId, {
        folders: ['c:\\users\\me\\Code\\', 'C:\\Users\\Me\\Notes'],
      }),
    ).resolves.toMatchObject({
      folders: ['c:\\users\\me\\Code', 'C:\\Users\\Me\\Notes'],
    });

    const input = {
      computerId,
      agentId: 'codex',
      content: [{ type: 'text' as const, text: 'hi' }],
    };
    await expect(
      service.createSession(owner, { ...input, cwd: 'C:\\Users\\Me\\Desktop' }),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    await expect(
      service.createSession(owner, {
        ...input,
        cwd: 'C:\\Users\\Me\\code\\app',
      }),
    ).resolves.toMatchObject({ cwd: 'C:\\Users\\Me\\code\\app' });
    const [command] = await take(computerId);
    expect(command).toMatchObject({
      type: 'prompt',
      session: { cwd: 'C:\\Users\\Me\\code\\app' },
    });
  });
});
