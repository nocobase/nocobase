import { randomUUID } from 'node:crypto';
import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import type { DatabaseManager } from '@nocobase/db';
import { expect, vi } from 'vitest';

import { AgentSessionsService } from '../../server/service.js';
import { test } from '../helpers/database.js';
import { fakeFiles } from '../helpers/files.js';

const viewer = { userId: 'u1' };
const text = [{ type: 'text' as const, text: 'One sentence.' }];

async function setup(database: DatabaseManager) {
  const files = fakeFiles(database);
  const publish = vi.fn();
  const service = new AgentSessionsService({
    database,
    images: files.storage,
    publish,
  });
  const { computerId } = await service.register('u1', {
    protocol: BRIDGE_PROTOCOL_VERSION,
    computerId: null,
    bridgeStartedAt: 'one',
    computer: {
      name: 'Test',
      platform: 'linux',
      arch: 'x64',
      host: 'test',
      home: '/work',
      roots: ['/work'],
      agents: [{ id: 'codex', name: 'Codex', version: '1' }],
    },
  });
  const input = {
    computerId,
    agentId: 'codex',
    cwd: '/work',
    content: text,
    submissionId: randomUUID(),
  };
  publish.mockClear();
  return { service, input, files, publish };
}

test('new sessions and prompts return the original confirmation for sequential and concurrent retries', async ({
  database,
}) => {
  const { service, input, publish } = await setup(database);
  const created = await Promise.all(
    Array.from({ length: 6 }, () => service.createSession(viewer, input)),
  );
  expect(new Set(created.map((s) => s.id)).size).toBe(1);
  const session = created[0]!;
  expect(await service.createSession(viewer, input)).toEqual(session);
  const id = randomUUID();
  const prompts = await Promise.all(
    Array.from({ length: 6 }, () =>
      service.prompt(viewer, session.id, text, [], id),
    ),
  );
  expect(prompts).toEqual(Array(6).fill(prompts[0]));
  expect(await service.prompt(viewer, session.id, text, [], id)).toEqual(
    prompts[0],
  );
  expect(await database.repository('agentSessions').count()).toBe(1);
  expect(await database.repository('agentSessionEvents').count()).toBe(2);
  expect(await database.repository('agentSessionCommands').count()).toBe(2);
  expect(publish).toHaveBeenCalledTimes(2);
  const events = await service.listEvents('u1', session.id, {
    after: 0,
    limit: 50,
  });
  expect(events.map((e) => e.seq)).toEqual([1, 2]);
  expect(JSON.stringify(events)).not.toContain('_submission');
  const commands = await service.poll(
    'u1',
    {
      computerId: input.computerId,
      wait: false,
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'one',
    },
    new AbortController().signal,
  );
  expect(JSON.stringify(commands)).not.toContain('_submission');
});

test('conflicting input, target, operation and owner cannot reuse an ID or read another confirmation', async ({
  database,
}) => {
  const { service, input } = await setup(database);
  const session = await service.createSession(viewer, input);
  const conflict = { key: 'submissionConflict' };
  await expect(
    service.createSession(viewer, { ...input, cwd: '/work/other' }),
  ).rejects.toMatchObject(conflict);
  await expect(
    service.createSession({ userId: 'u2' }, input),
  ).rejects.toMatchObject(conflict);
  await expect(
    service.prompt(viewer, session.id, text, [], input.submissionId),
  ).rejects.toMatchObject(conflict);
  const id = randomUUID();
  await service.prompt(viewer, session.id, text, [], id);
  await expect(
    service.prompt(
      viewer,
      session.id,
      [{ type: 'text', text: 'different' }],
      [],
      id,
    ),
  ).rejects.toMatchObject(conflict);
  await expect(
    service.prompt(viewer, 'another-session', text, [], id),
  ).rejects.toMatchObject(conflict);
  await expect(
    service.prompt({ userId: 'u2' }, session.id, text, [], id),
  ).rejects.toMatchObject(conflict);
  await expect(
    service.createSession(viewer, { ...input, submissionId: id }),
  ).rejects.toMatchObject(conflict);
});

test('lost confirmations can be recovered after archival and computer removal without enqueueing again', async ({
  database,
}) => {
  const { service, input } = await setup(database);
  const session = await service.createSession(viewer, input);
  const id = randomUUID();
  const event = await service.prompt(viewer, session.id, text, [], id);
  await service.updateSession(viewer, session.id, { archived: true });
  await service.removeComputer('u1', input.computerId);
  expect((await service.createSession(viewer, input)).id).toBe(session.id);
  expect(await service.prompt(viewer, session.id, text, [], id)).toEqual(event);
  expect(await database.repository('agentSessionEvents').count()).toBe(2);
});

test('input object key order is normalized, but content and mentions order are significant', async ({
  database,
}) => {
  const { service, input } = await setup(database);
  const created = await service.createSession(viewer, {
    ...input,
    settings: { model: 'one', mode: 'two' },
  });
  expect(
    (
      await service.createSession(viewer, {
        ...input,
        settings: { mode: 'two', model: 'one' },
      })
    ).id,
  ).toBe(created.id);
  await expect(
    service.createSession(viewer, {
      ...input,
      settings: { mode: 'three', model: 'one' },
    }),
  ).rejects.toMatchObject({ key: 'submissionConflict' });
});

test('concurrent image retries save one image and failed transactions leave no session, event, command or file row', async ({
  database,
}) => {
  const { service, input, files } = await setup(database);
  const image = {
    type: 'image' as const,
    mimeType: 'image/png',
    data: Buffer.from('image').toString('base64'),
  };
  const request = { ...input, content: [...text, image] };
  const sessions = await Promise.all([
    service.createSession(viewer, request),
    service.createSession(viewer, request),
  ]);
  expect(sessions[0]!.id).toBe(sessions[1]!.id);
  expect(files.uploads).toHaveLength(1);
  const id = randomUUID();
  const prompt = await service.prompt(viewer, sessions[0]!.id, [image], [], id);
  expect(
    await service.prompt(viewer, sessions[0]!.id, [image], [], id),
  ).toEqual(prompt);
  expect(files.uploads).toHaveLength(2);
  const failing = new AgentSessionsService({
    database,
    images: {
      ...files.storage,
      keep: async (...args) => {
        await files.storage.keep(...args);
        throw new Error('Injected attachment failure');
      },
    },
  });
  const failedId = randomUUID();
  await expect(
    failing.createSession(viewer, { ...request, submissionId: failedId }),
  ).rejects.toThrow('Injected attachment failure');
  expect(
    await database
      .repository('agentSessions')
      .findOne({ filter: { id: failedId } }),
  ).toBeUndefined();
  expect(await database.repository('agentSessionEvents').count()).toBe(2);
  expect(await database.repository('agentSessionCommands').count()).toBe(2);
  expect(await database.repository('agentSessionImages').count()).toBe(2);
  expect(files.objects.size).toBe(2);
});

test('legacy callers without an ID retain distinct submissions', async ({
  database,
}) => {
  const { service, input } = await setup(database);
  const { submissionId: _id, ...legacy } = input;
  const first = await service.createSession(viewer, legacy);
  const second = await service.createSession(viewer, legacy);
  expect(first.id).not.toBe(second.id);
  await service.prompt(viewer, first.id, text);
  await service.prompt(viewer, first.id, text);
  expect(await database.repository('agentSessionEvents').count()).toBe(4);
});

test('retries preserve mentions without resolving or linking them again, and reject reordered content', async ({
  database,
}) => {
  const { service, input } = await setup(database);
  const resolve = vi.fn(
    async (ids: readonly string[]) =>
      new Map(
        ids.map((id) => [
          id,
          {
            key: id,
            title: 'Mention',
            group: 'Project',
            status: null,
            href: null,
            startable: false,
          },
        ]),
      ),
  );
  service.registerLinkKind('issue', { resolve });
  const mentions = [
    { kind: 'issue', refId: 'one' },
    { kind: 'issue', refId: 'two' },
  ];
  const request = {
    ...input,
    mentions,
    content: [...text, { type: 'text' as const, text: '#one #two' }],
  };
  const session = await service.createSession(viewer, request);
  const calls = resolve.mock.calls.length;
  expect((await service.createSession(viewer, request)).id).toBe(session.id);
  // getSession resolves its display links, but no new mention validation or write is performed.
  expect(resolve.mock.calls.length - calls).toBe(1);
  expect(await database.repository('agentSessionLinks').count()).toBe(2);
  await expect(
    service.createSession(viewer, {
      ...request,
      mentions: [...mentions].reverse(),
    }),
  ).rejects.toMatchObject({ key: 'submissionConflict' });
  await expect(
    service.createSession(viewer, {
      ...request,
      content: [...request.content].reverse(),
    }),
  ).rejects.toMatchObject({ key: 'submissionConflict' });
  const id = randomUUID();
  await service.prompt(viewer, session.id, text, mentions, id);
  const beforeRetry = resolve.mock.calls.length;
  await service.prompt(viewer, session.id, text, mentions, id);
  expect(resolve.mock.calls.length).toBe(beforeRetry);
  expect(await database.repository('agentSessionLinks').count()).toBe(2);
});

test('a failure after command insertion rolls back the whole new session and publishes nothing', async ({
  database,
}) => {
  const { service, input, publish } = await setup(database);
  const unsubscribe = database.connection().onRepositoryMutation(
    { collections: ['agentSessionCommands'] },
    {
      inTransaction: () => {
        throw new Error('Injected command failure');
      },
    },
  );
  try {
    await expect(service.createSession(viewer, input)).rejects.toThrow(
      'Injected command failure',
    );
    expect(await database.repository('agentSessions').count()).toBe(0);
    expect(await database.repository('agentSessionEvents').count()).toBe(0);
    expect(await database.repository('agentSessionCommands').count()).toBe(0);
    expect(publish).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
  }
  // The same ID is reusable after a complete rollback.
  expect((await service.createSession(viewer, input)).id).toBe(
    input.submissionId,
  );
});
