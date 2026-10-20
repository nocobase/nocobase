import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { BridgeSession, runBridge } from '@nocobase/acp-bridge';
import {
  BRIDGE_PROTOCOL_VERSION,
  BRIDGE_ROUTES,
  type BridgeEvent,
  type PollRequest,
  type PromptRequest,
  type RegisterRequest,
  type ReportRequest,
  type SessionTarget,
} from '@nocobase/acp-bridge/protocol';
import { describe, expect, vi } from 'vitest';

import { foldTranscript } from '../../client/transcript.js';
import { AgentSessionsService } from '../../server/service.js';
import { test } from '../helpers/database.js';

const owner = { userId: 'owner' };
const text = (text: string) => [{ type: 'text' as const, text }];
const generation = {
  protocol: BRIDGE_PROTOCOL_VERSION,
  bridgeStartedAt: 'one',
};
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

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('bridge execution lifecycle', () => {
  test('confirms the previous turn report, including retries, before claiming its successor', async ({
    database,
  }) => {
    const service = new AgentSessionsService({ database });
    const root = await mkdtemp(path.join(os.tmpdir(), 'session-lifecycle-'));
    const stop = new AbortController();
    const registered = deferred<string>();
    const retry = deferred();
    const releaseReport = deferred();
    const finished = deferred();
    const order: string[] = [];
    const claims: string[] = [];
    let attempts = 0;
    let firstPrompt = '';
    let secondPrompt = '';
    let sessionId = '';
    let linked = false;
    const reports: ReportRequest[] = [];
    const server = createServer((request, response) => {
      let content = '';
      request.on('data', (chunk: Buffer) => {
        content += chunk.toString();
      });
      request.on('end', () => {
        void (async () => {
          const body: unknown = JSON.parse(content);
          let result: unknown;
          switch (request.url) {
            case BRIDGE_ROUTES.register: {
              const answer = await service.register(
                owner.userId,
                body as RegisterRequest,
              );
              registered.resolve(answer.computerId);
              result = answer;
              break;
            }
            case BRIDGE_ROUTES.poll:
              result = await service.poll(
                owner.userId,
                body as PollRequest,
                stop.signal,
              );
              break;
            case BRIDGE_ROUTES.claim: {
              const claim = body as PromptRequest;
              claims.push(claim.promptId);
              order.push(`claim:${claim.promptId}`);
              result = await service.claim(owner.userId, claim);
              break;
            }
            case BRIDGE_ROUTES.report: {
              const report = body as ReportRequest;
              const endsFirst = report.events.some(
                (event) =>
                  event.kind === 'turnEnded' && event.promptId === firstPrompt,
              );
              if (endsFirst && !linked) {
                linked = true;
                await service.link(sessionId, 'issue', 'task-from-first-turn');
              }
              result = await service.report(owner.userId, report);
              reports.push(report);
              if (endsFirst) {
                attempts += 1;
                order.push(`end:${firstPrompt}`);
                if (attempts === 1) {
                  // The database committed, but the response failed. Retry must retain the batch identity.
                  response.writeHead(503).end('{}');
                  return;
                }
                retry.resolve();
                await releaseReport.promise;
              }
              if (
                report.events.some(
                  (event) =>
                    event.kind === 'turnEnded' &&
                    event.promptId === secondPrompt,
                )
              )
                finished.resolve();
              break;
            }
            default:
              throw new Error(`Unexpected route: ${request.url}`);
          }
          response
            .writeHead(200, { 'content-type': 'application/json' })
            .end(JSON.stringify({ data: result }));
        })().catch((error: unknown) =>
          response.writeHead(500).end(String(error)),
        );
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    // Reuse the bridge package's scriptable ACP process, reached through its package root rather than source imports.
    const fixture = path.join(
      path.dirname(
        createRequire(import.meta.url).resolve(
          '@nocobase/acp-bridge/package.json',
        ),
      ),
      'tests/fixtures/fake-agent.mjs',
    );
    // Copilot resolves only from PATH; home-directory launchers could select a developer's installed agent.
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
    await writeFile(
      path.join(bin, 'copilot'),
      `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(fixture)} "$@"\n`,
      { mode: 0o755 },
    );
    let preparations = 0;
    const done = runBridge({
      server: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      headers: {},
      client: { name: 'test', version: '0.0.0' },
      stateFile: path.join(root, 'bridge-state.json'),
      roots: [root],
      env: { PATH: bin, NOCOBASE_ACP_ADAPTERS: 'installed' },
      prepareSession: async () => {
        if (preparations++ === 0) throw new Error('First turn failed.');
        return {};
      },
      signal: stop.signal,
      log: () => undefined,
    });
    try {
      const computerId = await registered.promise;
      const session = await service.createSession(owner, {
        computerId,
        agentId: 'copilot',
        cwd: root,
        content: text('first'),
      });
      sessionId = session.id;
      const first = (
        await service.listEvents(owner.userId, session.id, {
          after: 0,
          limit: 10,
        })
      )[0]!;
      if (first.kind !== 'prompt') throw new Error('Expected prompt');
      firstPrompt = first.promptId;
      const second = await service.prompt(owner, session.id, text('second'));
      if (second.kind !== 'prompt') throw new Error('Expected prompt');
      secondPrompt = second.promptId;
      await retry.promise;
      expect(claims).toEqual([firstPrompt]);
      releaseReport.resolve();
      await finished.promise;
      const transcript = await service.listEvents(owner.userId, session.id, {
        after: 0,
        limit: 200,
      });
      expect(
        transcript
          .filter(
            (event) =>
              event.kind === 'turnStarted' || event.kind === 'turnEnded',
          )
          .map((event) => `${event.kind}:${event.promptId}`),
      ).toEqual([
        `turnStarted:${firstPrompt}`,
        `turnEnded:${firstPrompt}`,
        `turnStarted:${secondPrompt}`,
        `turnEnded:${secondPrompt}`,
      ]);
      const items = foldTranscript(transcript);
      expect(items.filter((item) => item.type === 'turn')).toMatchObject([
        { error: 'First turn failed.', seconds: expect.any(Number) },
        {
          error: null,
          usage: { inputTokens: 10, outputTokens: 2, totalTokens: 12 },
          seconds: expect.any(Number),
        },
      ]);
      const link = items.findIndex((item) => item.type === 'links');
      const boundaries = items.flatMap((item, index) =>
        item.type === 'turn' ? [index] : [],
      );
      expect(link).toBe(boundaries[0]! + 1);
      expect(link).toBeLessThan(boundaries[1]!);
      expect(items.filter((item) => item.type === 'prompt')).toMatchObject([
        { state: 'failed' },
        { state: 'done' },
      ]);
      const retried = reports.filter((report) =>
        report.events.some(
          (event) =>
            event.kind === 'turnEnded' && event.promptId === firstPrompt,
        ),
      );
      expect(retried).toHaveLength(2);
      expect(retried[0]).toEqual(retried[1]);
      expect(order.indexOf(`claim:${secondPrompt}`)).toBeGreaterThan(
        order.lastIndexOf(`end:${firstPrompt}`),
      );
      expect((await service.getSession(owner, session.id)).running).toBe(false);
    } finally {
      releaseReport.resolve();
      if (secondPrompt) await finished.promise;
      stop.abort();
      await done;
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(root, { recursive: true, force: true });
    }
  });

  for (const reply of [
    'delayed',
    'lostBeforeClose',
    'lostAfterClose',
  ] as const) {
    test(`settles an approved claim with a ${reply} reply when archived, and stays stopped after restore`, async ({
      database,
    }) => {
      const service = new AgentSessionsService({ database });
      const { computerId } = await service.register(owner.userId, registration);
      const created = await service.createSession(owner, {
        computerId,
        agentId: 'fake',
        cwd: '/work',
        content: text('must not execute'),
      });
      const command = (
        await service.poll(
          owner.userId,
          { ...generation, computerId, wait: false },
          new AbortController().signal,
        )
      ).commands.find((command) => command.type === 'prompt');
      if (command?.type !== 'prompt' || command.seq === undefined)
        throw new Error('Expected sequenced prompt');
      const identity = {
        ...generation,
        computerId,
        sessionId: created.id,
        promptId: command.promptId,
        seq: command.seq,
      };
      const approved = deferred();
      const release = deferred();
      const cancelled = deferred();
      const events: BridgeEvent[] = [];
      let reports = Promise.resolve();
      let batch = 0;
      const resolveAgent = vi.fn(() => {
        throw new Error('A closed message reached the Agent.');
      });
      const target: SessionTarget = command.session;
      const session = new BridgeSession(target, {
        client: { name: 'test', version: '0.0.0' },
        env: {},
        roots: ['/work'],
        resolve: resolveAgent,
        claim: async () => {
          const answer = await service.claim(owner.userId, identity);
          approved.resolve();
          await release.promise;
          // A lost response is retried after archive; the server now declines this previously approved claim.
          return reply !== 'delayed'
            ? (await service.claim(owner.userId, identity)).execute
            : answer.execute;
        },
        emit: (event) => {
          events.push(event);
          if (event.kind === 'turnEnded') cancelled.resolve();
          if (event.kind === 'turnStarted') return;
          reports = reports.then(async () => {
            await service.report(owner.userId, {
              computerId,
              sessionId: created.id,
              bridgeStartedAt: 'one',
              batch: ++batch,
              events: [event],
              state: null,
            });
          });
        },
        stateChanged: () => undefined,
      });
      try {
        session.handle(command);
        await approved.promise;
        expect((await service.getSession(owner, created.id)).running).toBe(
          true,
        );
        await service.updateSession(owner, created.id, { archived: true });
        if (reply === 'lostBeforeClose') {
          release.resolve();
          await cancelled.promise;
        }
        await session.close();
        await session.close();
        // Cancellation must settle even while the claim response remains unresolved.
        await reports;
        const closed = await service.getSession(owner, created.id);
        expect(closed.running).toBe(false);
        expect(events).toMatchObject([
          {
            kind: 'turnEnded',
            promptId: command.promptId,
            seq: command.seq,
            stopReason: 'cancelled',
          },
        ]);
        release.resolve();
        await service.updateSession(owner, created.id, { archived: false });
        expect((await service.getSession(owner, created.id)).running).toBe(
          false,
        );
        expect(await service.claim(owner.userId, identity)).toEqual({
          execute: false,
        });
        session.handle(command);
        expect(resolveAgent).not.toHaveBeenCalled();
        const transcript = await service.listEvents(owner.userId, created.id, {
          after: 0,
          limit: 100,
        });
        expect(
          transcript.filter((event) => event.kind === 'turnEnded'),
        ).toHaveLength(1);
        expect(
          foldTranscript(transcript).filter((item) => item.type === 'prompt'),
        ).toMatchObject([{ state: 'cancelled' }]);
      } finally {
        release.resolve();
        await session.close();
        await reports;
      }
    });
  }
});
