import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NpmCredentialRequest } from '../server/tokens.js';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const start = {
  workDir: '/work/SMP-1',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};

const FEATURES = ['input', 'npmCredentials'] as const;
const TOKEN = 'synthetic-npm-registry-token-1234';

describe('the private npm registry token on demand', () => {
  let h: Harness;
  afterEach(async () => {
    vi.restoreAllMocks();
    await h?.close();
  });

  async function claimed(): Promise<{
    runner: RegisteredRunner;
    runId: string;
  }> {
    const agentId = await h.createAgent({ maxAttempts: 3 });
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner({ features: [...FEATURES] });
    const [payload] = await claim(h, runner);
    return { runner, runId: payload.run.id as string };
  }

  const ask = (runner: RegisteredRunner, runId: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${runId}/npmCredentials`, {
      runnerKey: runner.key,
      body,
    });

  it('answers null without a provider, and the provider’s token with one, logging why without the token', async () => {
    h = await createHarness();
    const { runner, runId } = await claimed();
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const none = await ask(runner, runId, { attempt: 1, reason: 'declared' });
    expect(none.status).toBe(200);
    expect(none.body.data).toEqual({ token: null });

    const requests: NpmCredentialRequest[] = [];
    h.services.npmCredentialProviders.register({
      key: 'test',
      issue: async (request) => {
        requests.push(request);
        return TOKEN;
      },
    });
    const issued = await ask(runner, runId, {
      attempt: 1,
      reason: 'notFound',
      package: '@nocobase/plugin-private@1.0.0',
    });
    expect(issued.status).toBe(200);
    expect(issued.body.data).toEqual({ token: TOKEN });
    expect(requests).toMatchObject([
      {
        attempt: 1,
        reason: 'notFound',
        package: '@nocobase/plugin-private@1.0.0',
        run: { id: runId },
      },
    ]);
    const lines = info.mock.calls.map((call) => String(call[0]));
    expect(lines).toEqual([
      `npm credential unconfigured run=${runId} reason=declared`,
      `npm credential issued run=${runId} reason=notFound package=@nocobase/plugin-private@1.0.0`,
    ]);
    expect(lines.join('\n')).not.toContain(TOKEN);
  });

  it('refuses a malformed request, another runner, another attempt and a run past its lease', async () => {
    h = await createHarness();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    h.services.npmCredentialProviders.register({
      key: 'test',
      issue: async () => TOKEN,
    });
    const { runner, runId } = await claimed();

    expect(
      (await ask(runner, runId, { attempt: 1, reason: 'because' })).status,
    ).toBe(400);
    expect(
      (
        await ask(runner, runId, {
          attempt: 1,
          reason: 'notFound',
          package: 'a\nnpm credential issued',
        })
      ).status,
    ).toBe(400);
    const unauthenticated = await h.request(
      'POST',
      `/agents/runners/runs/${runId}/npmCredentials`,
      { body: { attempt: 1, reason: 'declared' } },
    );
    expect(unauthenticated.status).toBe(401);

    const stranger = await h.registerRunner({
      name: 'other',
      features: [...FEATURES],
    });
    const notOwned = await ask(stranger, runId, {
      attempt: 1,
      reason: 'declared',
    });
    expect(notOwned.body.error.reason).toBe('RUN_NOT_OWNED');

    const otherAttempt = await ask(runner, runId, {
      attempt: 2,
      reason: 'declared',
    });
    expect(otherAttempt.status).toBe(409);
    expect(otherAttempt.body.error.reason).toBe('LEASE_LOST');

    await h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: start,
    });
    h.clock.advance(46_000);
    const expired = await ask(runner, runId, { attempt: 1, reason: 'declared' });
    expect(expired.status).toBe(409);
    expect(expired.body.error.reason).toBe('LEASE_LOST');
  });

  it('redacts the token it gave from what the run reports', async () => {
    h = await createHarness();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    h.services.npmCredentialProviders.register({
      key: 'test',
      issue: async () => TOKEN,
    });
    const { runner, runId } = await claimed();
    expect(
      (await ask(runner, runId, { attempt: 1, reason: 'declared' })).body.data,
    ).toEqual({ token: TOKEN });
    const post = (action: string, body: unknown) =>
      h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
        runnerKey: runner.key,
        body,
      });
    await post('start', start);
    await post('events', {
      events: [
        {
          seq: 1,
          at: '2026-10-01T00:00:01.000Z',
          type: 'text',
          content: `token ${TOKEN} here`,
        },
      ],
    });
    const page = await h.services.runs.events(runId, 0, 10);
    expect(page.events[0]?.content).toBe('token [REDACTED] here');
  });

  it('answers an internal error when the provider fails, without giving a token', async () => {
    h = await createHarness();
    h.services.npmCredentialProviders.register({
      key: 'broken',
      issue: async () => {
        throw new Error('database is down');
      },
    });
    const { runner, runId } = await claimed();
    const answer = await ask(runner, runId, { attempt: 1, reason: 'declared' });
    expect(answer.status).toBe(500);
    expect(answer.body.error.reason).toBe('INTERNAL_ERROR');
  });
});
