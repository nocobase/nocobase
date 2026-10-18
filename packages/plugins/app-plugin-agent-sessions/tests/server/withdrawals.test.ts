import {
  BRIDGE_PROTOCOL_VERSION,
  type PromptRequest,
} from '@nocobase/acp-bridge/protocol';
import { describe, expect, vi } from 'vitest';
import { AgentSessionsService } from '../../server/service.js';
import {
  computers,
  events,
  enqueue,
  takeCommands,
  commands,
} from '../../server/store.js';
import { test } from '../helpers/database.js';

const owner = { userId: 'owner' };
const text = (text: string) => [{ type: 'text' as const, text }];
const signal = new AbortController().signal;
const generation = {
  protocol: BRIDGE_PROTOCOL_VERSION,
  bridgeStartedAt: 'one',
};

describe('queued message withdrawal', () => {
  test('rejects a stale report that waited while a replacement bridge claimed the next message', async ({
    database,
  }) => {
    const service = new AgentSessionsService({ database });
    const registration = {
      ...generation,
      computerId: null,
      computer: {
        name: 'Test',
        platform: 'linux',
        arch: 'x64',
        host: 'test',
        roots: ['/work'],
        agents: [{ id: 'fake', name: 'Fake', version: null }],
      },
    };
    const { computerId } = await service.register(owner.userId, registration);
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'fake',
      cwd: '/work',
      content: text('A'),
    });
    const first = (
      await service.listEvents(owner.userId, session.id, {
        after: 0,
        limit: 10,
      })
    )[0]!;
    if (first.kind !== 'prompt') throw new Error('Expected prompt');
    await service.claim(owner.userId, {
      ...generation,
      computerId,
      sessionId: session.id,
      seq: first.seq,
      promptId: first.promptId,
    });
    const next = await service.prompt(owner, session.id, text('B'));
    if (next.kind !== 'prompt') throw new Error('Expected prompt');
    let enter!: () => void;
    let release!: () => void;
    const entered = new Promise<void>((resolve) => {
      enter = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = database.transaction.bind(database);
    const blocked = vi
      .spyOn(database, 'transaction')
      .mockImplementationOnce(async (work, options) => {
        enter();
        await gate;
        return transaction(work, options);
      });
    const pending = service.report(owner.userId, {
      computerId,
      sessionId: session.id,
      bridgeStartedAt: 'one',
      batch: 1,
      events: [],
      state: {
        acpSessionId: 'stale-acp',
        agent: 'Fake',
        choices: [],
        commands: [],
        title: 'Stale state',
        context: null,
      },
    });
    const outcome = pending.then(
      () => undefined,
      (error: unknown) => error,
    );
    try {
      await entered;
      await service.register(
        owner.userId,
        { ...registration, computerId, bridgeStartedAt: 'two' },
        true,
      );
      expect(
        await service.claim(owner.userId, {
          ...generation,
          bridgeStartedAt: 'two',
          computerId,
          sessionId: session.id,
          seq: next.seq,
          promptId: next.promptId,
        }),
      ).toEqual({ execute: true });
      release();
      expect(await outcome).toMatchObject({ key: 'bridgeReplaced' });
      const current = await service.getSession(owner, session.id);
      expect(current.running).toBe(true);
      expect(current.state).toBeNull();
      expect(current.title).not.toBe('Stale state');
    } finally {
      release();
      await outcome;
      blocked.mockRestore();
    }
  });
  test('does not let retained withdrawals starve ordinary commands', async ({
    database,
  }) => {
    const connection = database.connection();
    const at = new Date().toISOString();
    const [head, ...tail] = Array.from({ length: 51 }, (_, index) => ({
      id: `withdraw:${String(index).padStart(27, '0')}`,
      computerId: 'computer',
      command: {
        type: 'withdrawPrompt' as const,
        sessionId: 'session',
        promptId: `p${index}`,
        seq: index + 1,
      },
      createdAt: at,
    }));
    await commands(connection).createMany({ values: [head!, ...tail] });
    await enqueue(
      connection,
      'computer',
      { type: 'close', sessionId: 'other' },
      at,
    );
    const first = await takeCommands(connection, 'computer');
    expect(
      first.filter((command) => command.type === 'withdrawPrompt'),
    ).toHaveLength(25);
    expect(first).toContainEqual({ type: 'close', sessionId: 'other' });
    await enqueue(
      connection,
      'computer',
      { type: 'close', sessionId: 'next' },
      at,
    );
    const second = await takeCommands(connection, 'computer');
    expect(second).toContainEqual({ type: 'close', sessionId: 'next' });
    expect(
      second.filter((command) => command.type === 'withdrawPrompt'),
    ).toHaveLength(25);
  });
  test('arbitrates execution, keeps other turns and images, persists offline withdrawal until acknowledgement, and rejects stale delivery', async ({
    database,
  }) => {
    let time = Date.now();
    const service = new AgentSessionsService({ database, now: () => time });
    const { computerId } = await service.register(owner.userId, {
      ...generation,
      computerId: null,
      computer: {
        name: 'Test',
        platform: 'linux',
        arch: 'x64',
        host: 'test',
        roots: ['/work'],
        agents: [{ id: 'fake', name: 'Fake', version: null }],
      },
    });
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'fake',
      cwd: '/work',
      content: text('A'),
    });
    const a = (
      await service.listEvents(owner.userId, session.id, {
        after: 0,
        limit: 100,
      })
    )[0]!;
    if (a.kind !== 'prompt') throw new Error('Expected prompt');
    const request = (seq: number, promptId: string): PromptRequest => ({
      ...generation,
      computerId,
      sessionId: session.id,
      seq,
      promptId,
    });
    expect(
      await service.claim(owner.userId, request(a.seq, a.promptId)),
    ).toEqual({ execute: true });
    // A never received these instructions. Withdrawing their first carrier B must leave C self-contained.
    service.registerInstructions('Required context introduced with B.');
    const image = {
      type: 'image' as const,
      mimeType: 'image/png',
      data: 'aGVsbG8=',
    };
    const b = await service.prompt(owner, session.id, [...text('B'), image]);
    const c = await service.prompt(owner, session.id, text('C'));
    if (b.kind !== 'prompt' || c.kind !== 'prompt')
      throw new Error('Expected prompts');
    // The bridge already received B; withdrawal must still veto its later claim.
    const dispatched = await service.poll(
      owner.userId,
      { ...generation, computerId, wait: false },
      signal,
    );
    await expect(
      service.withdraw('stranger', session.id, b.seq),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await expect(
      service.withdraw(owner.userId, session.id, a.seq),
    ).rejects.toMatchObject({ key: 'promptStarted' });
    time += 70_000;
    await service.withdraw(owner.userId, session.id, b.seq);
    await service.withdraw(owner.userId, session.id, b.seq);
    const following = dispatched.commands.find(
      (command) => command.type === 'prompt' && command.promptId === c.promptId,
    );
    expect(following?.type === 'prompt' && following.content).toContainEqual({
      type: 'text',
      text: 'How to work in this session:\nRequired context introduced with B.',
    });
    expect(
      await service.claim(owner.userId, request(b.seq, b.promptId)),
    ).toEqual({ execute: false });
    expect((await service.getSession(owner, session.id)).running).toBe(true);
    const take = () =>
      service.poll(
        owner.userId,
        { ...generation, computerId, wait: false },
        signal,
      );
    const first = (await take()).commands;
    expect(first).toEqual([
      {
        type: 'withdrawPrompt',
        sessionId: session.id,
        seq: b.seq,
        promptId: b.promptId,
      },
    ]);
    expect((await take()).commands).toEqual(first); // Lost response: retained until confirmation.
    await service.withdrawn(owner.userId, request(b.seq, b.promptId));
    await service.withdrawn(owner.userId, request(b.seq, b.promptId));
    expect((await take()).commands).toEqual([]);
    expect((await service.getSession(owner, session.id)).running).toBe(true);
    await service.report(owner.userId, {
      ...generation,
      computerId,
      sessionId: session.id,
      batch: 1,
      state: null,
      events: [
        {
          kind: 'turnEnded',
          seq: b.seq,
          at: new Date(time).toISOString(),
          promptId: b.promptId,
          stopReason: 'cancelled',
          usage: null,
          error: null,
        },
      ],
    });
    expect((await service.getSession(owner, session.id)).running).toBe(true);
    const transcript = await service.listEvents(owner.userId, session.id, {
      after: 0,
      limit: 100,
    });
    expect(
      transcript.filter((event) => event.kind === 'withdrawalRequested'),
    ).toHaveLength(1);
    expect(
      transcript.filter((event) => event.kind === 'promptWithdrawn'),
    ).toHaveLength(1);
    expect(transcript.find((event) => event.seq === b.seq)).toMatchObject({
      content: [...text('B'), image],
    });
    expect(JSON.stringify(transcript)).not.toContain('_execution');
    expect(
      await service.claim(owner.userId, request(c.seq, c.promptId)),
    ).toEqual({ execute: true });
    expect(
      await service.claim(owner.userId, request(c.seq, c.promptId)),
    ).toEqual({ execute: true });
    await expect(
      service.withdraw(owner.userId, session.id, c.seq),
    ).rejects.toMatchObject({ key: 'promptStarted' });
    await service.report(owner.userId, {
      ...generation,
      computerId,
      sessionId: session.id,
      batch: 2,
      state: null,
      events: [
        {
          kind: 'turnEnded',
          seq: a.seq,
          at: new Date(time).toISOString(),
          promptId: a.promptId,
          stopReason: 'end_turn',
          usage: null,
          error: null,
        },
      ],
    });
    expect((await service.getSession(owner, session.id)).running).toBe(true);
    await service.report(owner.userId, {
      ...generation,
      computerId,
      sessionId: session.id,
      batch: 3,
      state: null,
      events: [
        {
          kind: 'turnEnded',
          seq: c.seq,
          at: new Date(time).toISOString(),
          promptId: c.promptId,
          stopReason: 'end_turn',
          usage: null,
          error: null,
        },
      ],
    });
    expect((await service.getSession(owner, session.id)).running).toBe(false);
    expect(
      await service.claim(owner.userId, request(c.seq, c.promptId)),
    ).toEqual({ execute: false });
  });

  test('permits only one winner under simultaneous claim and withdrawal, and fences old bridges and unknown messages', async ({
    database,
  }) => {
    const service = new AgentSessionsService({ database });
    const registration = {
      ...generation,
      computerId: null,
      computer: {
        name: 'Test',
        platform: 'linux',
        arch: 'x64',
        host: 'test',
        roots: ['/work'],
        agents: [{ id: 'fake', name: 'Fake', version: null }],
      },
    };
    const { computerId } = await service.register(owner.userId, registration);
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'fake',
      cwd: '/work',
      content: text('Race'),
    });
    const prompt = (
      await service.listEvents(owner.userId, session.id, {
        after: 0,
        limit: 10,
      })
    )[0]!;
    if (prompt.kind !== 'prompt') throw new Error('Expected prompt');
    const request = {
      ...generation,
      computerId,
      sessionId: session.id,
      seq: prompt.seq,
      promptId: prompt.promptId,
    };
    const [claim, withdrawal] = await Promise.allSettled([
      service.claim(owner.userId, request),
      service.withdraw(owner.userId, session.id, prompt.seq),
    ]);
    expect(claim.status).toBe('fulfilled');
    if (claim.status !== 'fulfilled') throw claim.reason;
    expect(claim.value.execute).toBe(withdrawal.status === 'rejected');
    await expect(service.claim('stranger', request)).rejects.toMatchObject({
      key: 'computerNotFound',
    });
    await expect(
      service.claim(owner.userId, { ...request, promptId: 'wrong' }),
    ).rejects.toMatchObject({ key: 'promptNotFound' });
    await expect(
      service.poll(owner.userId, { computerId, wait: false }, signal),
    ).rejects.toMatchObject({ key: 'upgradeRequired' });
    await service.register(
      owner.userId,
      { ...registration, computerId, bridgeStartedAt: 'two' },
      true,
    );
    await expect(service.claim(owner.userId, request)).rejects.toMatchObject({
      key: 'bridgeReplaced',
    });
    expect(
      await service.claim(owner.userId, { ...request, bridgeStartedAt: 'two' }),
    ).toEqual({ execute: false });
    // A pre-upgrade in-flight prompt has no claim decision, even after its computer upgrades.
    const row = await events(database.connection()).findOne({
      filter: { sessionId: session.id, seq: prompt.seq },
    });
    const { _execution: _decision, ...legacy } = row!.data;
    await events(database.connection()).updateMany({
      filter: { id: row!.id },
      values: { data: legacy },
    });
    await expect(
      service.withdraw(owner.userId, session.id, prompt.seq),
    ).rejects.toMatchObject({ key: 'withdrawalUnsupported' });
    await computers(database.connection()).updateMany({
      filter: { id: computerId },
      values: { protocol: null },
    });
    await expect(
      service.poll(
        owner.userId,
        { ...generation, computerId, wait: false },
        signal,
      ),
    ).rejects.toMatchObject({ key: 'upgradeRequired' });
  });
});
