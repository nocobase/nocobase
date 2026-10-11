import type { RunGit } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RepoAccessError,
  type RepoAccessContext,
  type RepoCredentialRequest,
  type RepoPrepareOptions,
} from '../server/tokens.js';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const APP = 'https://github.com/acme/app.git';
const LIB = 'https://github.com/acme/lib.git';
const OTHER = 'https://github.com/other/tools.git';

const start = {
  workDir: '/work/SMP-1',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};

const FEATURES = [
  'input',
  'checkout',
  'directories',
  'attachments',
  'skills',
  'secrets',
] as const;

describe('repository credentials on demand', () => {
  let h: Harness;
  afterEach(async () => {
    vi.restoreAllMocks();
    await h?.close();
  });

  function repos(...urls: string[]) {
    h.dirs = urls.map((url, index) => ({
      kind: 'repo' as const,
      url,
      defaultBranch: 'main',
      branch: 'agent/SMP-1',
      path: `repo-${index}`,
    }));
  }

  /** A provider that issues on demand for the repositories of `acme`, and hands out claim credentials otherwise. */
  function provide(
    options: {
      issue?: (request: RepoCredentialRequest) => Promise<unknown>;
    } = {},
  ) {
    const contexts: RepoAccessContext[] = [];
    const prepares: RepoPrepareOptions[] = [];
    const requests: RepoCredentialRequest[] = [];
    let minted = 0;
    h.services.repoAccess.register({
      key: 'test',
      prepare: async (_run, prepareOptions) => {
        prepares.push(prepareOptions);
        if (prepareOptions.onDemand) return null;
        minted += 1;
        return `synthetic-claim-token-${minted}`;
      },
      forRun: async (_conn, context, prepared): Promise<RunGit> => {
        contexts.push(context);
        const acme = context.repos
          .map((repo) => repo.url)
          .filter((url) => url.includes('/acme/'));
        return context.onDemand
          ? { onDemand: [...acme, 'https://github.com/acme/not-a-repo.git'] }
          : {
              credentials: acme.map((url) => ({
                url,
                username: 'x-access-token',
                password: String(prepared),
                expiresAt: '2026-10-01T01:00:00.000Z',
              })),
            };
      },
      issue: async (request) => {
        requests.push(request);
        if (options.issue)
          return (await options.issue(request)) as Awaited<
            ReturnType<NonNullable<typeof options.issue>>
          > as never;
        if (!request.url.includes('/acme/')) return null;
        return {
          username: 'x-access-token',
          password: `synthetic-issued-${requests.length}-${request.refresh ? 'fresh' : 'cached'}`,
          expiresAt: new Date(
            h.clock.now().getTime() + 3_600_000,
          ).toISOString(),
        };
      },
    });
    return { contexts, prepares, requests, minted: () => minted };
  }

  async function claimedOnDemand(
    features: readonly string[] = [...FEATURES, 'gitCredentials'],
  ): Promise<{ runner: RegisteredRunner; payload: any }> {
    const agentId = await h.createAgent({ maxAttempts: 3 });
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner({
      features: features as never,
    });
    const [payload] = await claim(h, runner);
    return { runner, payload };
  }

  const ask = (runner: RegisteredRunner, runId: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${runId}/gitCredentials`, {
      runnerKey: runner.key,
      body,
    });

  it('lists repositories on demand for a runner with the feature, minting nothing at the claim', async () => {
    h = await createHarness();
    repos(APP, LIB, OTHER);
    const provider = provide();
    const { payload } = await claimedOnDemand();
    expect(provider.prepares).toEqual([{ onDemand: true }]);
    expect(provider.minted()).toBe(0);
    expect(provider.contexts[0]?.onDemand).toBe(true);
    // Only the run's own repositories, whatever the provider lists.
    expect(payload.workspace.git).toEqual({ onDemand: [APP, LIB] });
  });

  it('hands out credentials with the claim to a runner without the feature, as before', async () => {
    h = await createHarness();
    repos(APP);
    const provider = provide();
    const { runner, payload } = await claimedOnDemand([...FEATURES]);
    expect(provider.prepares).toEqual([{ onDemand: false }]);
    expect(payload.workspace.git).toEqual({
      credentials: [
        {
          url: APP,
          username: 'x-access-token',
          password: 'synthetic-claim-token-1',
          expiresAt: '2026-10-01T01:00:00.000Z',
        },
      ],
    });
    // Nothing is issued on demand for a run that was not claimed that way.
    const refused = await ask(runner, payload.run.id, {
      attempt: 1,
      url: APP,
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error.reason).toBe('INVALID_REQUEST');
  });

  it('issues a credential per repository of the run, again on every ask, fresh on refresh', async () => {
    h = await createHarness();
    repos(APP, LIB);
    const provider = provide();
    const { runner, payload } = await claimedOnDemand();
    const runId = payload.run.id as string;

    const first = await ask(runner, runId, { attempt: 1, url: APP });
    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({
      username: 'x-access-token',
      password: 'synthetic-issued-1-cached',
      expiresAt: '2026-10-01T01:00:00.000Z',
    });
    // Past the first credential's lifetime.
    // Long after the claim: the run is still held, so the application is asked again.
    for (let minute = 0; minute < 90; minute += 0.5) {
      h.clock.advance(30_000);
      await h.request('POST', `/agents/runners/runs/${runId}/lease`, {
        runnerKey: runner.key,
        body: {},
      });
    }
    const lib = await ask(runner, runId, {
      attempt: 1,
      url: LIB,
      refresh: true,
    });
    expect(lib.body.data.password).toBe('synthetic-issued-2-fresh');
    expect(provider.requests.map((request) => request.url)).toEqual([APP, LIB]);
    expect(provider.requests[1]).toMatchObject({
      runnerId: runner.runnerId,
      attempt: 1,
      refresh: true,
    });
    expect(provider.requests[1]!.run.id).toBe(runId);
  });

  it('compares the URL exactly with the one the claim handed out', async () => {
    h = await createHarness();
    repos(APP);
    provide();
    const { runner, payload } = await claimedOnDemand();
    const runId = payload.run.id as string;
    for (const url of [
      'https://github.com/acme/app',
      'https://github.com/ACME/app.git',
      'https://x-access-token:t@github.com/acme/app.git',
      'https://github.com/acme/not-a-repo.git',
      OTHER,
    ]) {
      const answer = await ask(runner, runId, { attempt: 1, url });
      expect([url, answer.status, answer.body.error.reason]).toEqual([
        url,
        400,
        'INVALID_REQUEST',
      ]);
    }
  });

  it('refuses another runner, an earlier attempt, a run past its lease and a run that ended', async () => {
    h = await createHarness();
    repos(APP);
    const provider = provide();
    const { runner, payload } = await claimedOnDemand();
    const runId = payload.run.id as string;

    const stranger = await h.registerRunner({
      name: 'other',
      features: [...FEATURES, 'gitCredentials'],
    });
    const notOwned = await ask(stranger, runId, { attempt: 1, url: APP });
    expect(notOwned.body.error.reason).toBe('RUN_NOT_OWNED');

    const otherAttempt = await ask(runner, runId, { attempt: 2, url: APP });
    expect(otherAttempt.status).toBe(409);
    expect(otherAttempt.body.error.reason).toBe('LEASE_LOST');

    // The lease runs out before the sweeper has taken the run back.
    h.clock.advance(46_000);
    const expired = await ask(runner, runId, { attempt: 1, url: APP });
    expect(expired.status).toBe(409);
    expect(expired.body.error.reason).toBe('LEASE_LOST');

    // The run goes back to the queue and its next attempt is taken by the same runner.
    await h.request('POST', `/agents/runners/runs/${runId}/lease`, {
      runnerKey: runner.key,
      body: {},
    });
    await h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: start,
    });
    const failed = await h.request(
      'POST',
      `/agents/runners/runs/${runId}/fail`,
      { runnerKey: runner.key, body: { reason: 'toolNetwork' } },
    );
    expect(failed.body.data.status).toBe('queued');
    const queued = await ask(runner, runId, { attempt: 1, url: APP });
    expect(queued.body.error.reason).toBe('LEASE_LOST');
    h.clock.advance(60_000);
    const [again] = await claim(h, runner);
    expect(again.run.attempt).toBe(2);
    const old = await ask(runner, runId, { attempt: 1, url: APP });
    expect(old.body.error.reason).toBe('LEASE_LOST');
    expect((await ask(runner, runId, { attempt: 2, url: APP })).status).toBe(
      200,
    );

    await h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: start,
    });
    await h.request('POST', `/agents/runners/runs/${runId}/complete`, {
      runnerKey: runner.key,
      body: {
        summary: 'Done.',
        handledInputIds: again.inputs.map((input: { id: string }) => input.id),
      },
    });
    const ended = await ask(runner, runId, { attempt: 2, url: APP });
    expect(ended.body.error.reason).toBe('RUN_NOT_ACTIVE');
    // Only the two answers that were given asked the application.
    expect(provider.requests).toHaveLength(1);
  });

  describe('when the run changes while the application issues', () => {
    /** A provider that answers only when the test lets it, with a credential valid for `validMs` from the time asked. */
    function paused(validMs = 3_600_000) {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let asked: () => void = () => undefined;
      const started = new Promise<void>((resolve) => {
        asked = resolve;
      });
      let count = 0;
      provide({
        issue: async () => {
          count += 1;
          const expiresAt = new Date(
            h.clock.now().getTime() + validMs,
          ).toISOString();
          asked();
          await gate;
          return {
            username: 'x-access-token',
            password: `synthetic-late-credential-${count}`,
            expiresAt,
          };
        },
      });
      return { release: () => release(), started };
    }

    const post = (
      runner: RegisteredRunner,
      runId: string,
      action: string,
      body: unknown,
    ) =>
      h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
        runnerKey: runner.key,
        body,
      });

    it('drops the credential when the lease ran out meanwhile', async () => {
      h = await createHarness();
      repos(APP);
      const provider = paused();
      const { runner, payload } = await claimedOnDemand();
      const pending = ask(runner, payload.run.id, { attempt: 1, url: APP });
      await provider.started;
      h.clock.advance(46_000);
      provider.release();
      const answer = await pending;
      expect([answer.status, answer.body.error?.reason]).toEqual([
        409,
        'LEASE_LOST',
      ]);
      expect(JSON.stringify(answer.body)).not.toContain('synthetic-late');
    });

    it('drops the credential when the run completed or was cancelled meanwhile', async () => {
      for (const end of ['complete', 'cancel'] as const) {
        h = await createHarness();
        repos(APP);
        const provider = paused();
        const { runner, payload } = await claimedOnDemand();
        const runId = payload.run.id as string;
        await post(runner, runId, 'start', start);
        const pending = ask(runner, runId, { attempt: 1, url: APP });
        await provider.started;
        if (end === 'complete')
          await post(runner, runId, 'complete', {
            summary: 'Done.',
            handledInputIds: payload.inputs.map(
              (input: { id: string }) => input.id,
            ),
          });
        else {
          await h.services.runs.cancel(runId, 'owner');
          await post(runner, runId, 'cancelAck', {});
        }
        provider.release();
        const answer = await pending;
        expect([end, answer.status, answer.body.error?.reason]).toEqual([
          end,
          400,
          'RUN_NOT_ACTIVE',
        ]);
        expect(JSON.stringify(answer.body)).not.toContain('synthetic-late');
        await h.close();
      }
    });

    it('drops the credential when another runner took the next attempt meanwhile, and never remembers it for that attempt', async () => {
      h = await createHarness();
      repos(APP);
      const provider = paused();
      const { runner, payload } = await claimedOnDemand();
      const runId = payload.run.id as string;
      await post(runner, runId, 'start', start);
      const pending = ask(runner, runId, { attempt: 1, url: APP });
      await provider.started;
      expect(
        (await post(runner, runId, 'fail', { reason: 'toolNetwork' })).body.data
          .status,
      ).toBe('queued');
      h.clock.advance(60_000);
      const other = await h.registerRunner({
        name: 'other',
        features: [...FEATURES, 'gitCredentials'],
      });
      const [again] = await claim(h, other);
      expect(again.run.attempt).toBe(2);
      provider.release();
      const answer = await pending;
      expect([answer.status, answer.body.error?.reason]).toEqual([
        409,
        'LEASE_LOST',
      ]);
      // The dropped credential was not added to the run's redaction: only what was handed out is.
      await post(other, runId, 'start', start);
      await post(other, runId, 'events', {
        events: [
          {
            seq: again.run.firstSeq,
            at: '2026-10-01T00:02:00.000Z',
            type: 'text',
            content: 'synthetic-late-credential-1',
          },
        ],
      });
      const page = await h.services.runs.events(runId, 0, 100);
      expect(page.events.at(-1)?.content).toBe('synthetic-late-credential-1');
    });

    it('refuses a credential that expired while it was being issued', async () => {
      h = await createHarness();
      repos(APP);
      const provider = paused(100);
      const { runner, payload } = await claimedOnDemand();
      const pending = ask(runner, payload.run.id, { attempt: 1, url: APP });
      await provider.started;
      h.clock.advance(500);
      provider.release();
      const answer = await pending;
      expect([answer.status, answer.body.error?.reason]).toEqual([
        503,
        'REPO_ACCESS_UNAVAILABLE',
      ]);
      expect(JSON.stringify(answer.body)).not.toContain('synthetic-late');
    });
  });

  it('answers why the application did not issue one: unavailable, denied, slow or broken', async () => {
    h = await createHarness();
    repos(APP);
    let next: () => Promise<unknown> = () => Promise.resolve(null);
    provide({ issue: () => next() });
    const { runner, payload } = await claimedOnDemand();
    const runId = payload.run.id as string;
    const reasonOf = async () => {
      const answer = await ask(runner, runId, { attempt: 1, url: APP });
      return [
        answer.status,
        answer.body.error?.reason,
        answer.body.error?.message,
      ];
    };

    next = () =>
      Promise.reject(
        new RepoAccessError('unavailable', 'GitHub is unavailable just now.'),
      );
    expect(await reasonOf()).toEqual([
      503,
      'REPO_ACCESS_UNAVAILABLE',
      'GitHub is unavailable just now.',
    ]);

    next = () =>
      Promise.reject(
        new RepoAccessError(
          'denied',
          'The GitHub App is not installed on acme/app.',
        ),
      );
    expect(await reasonOf()).toEqual([
      403,
      'REPO_ACCESS_DENIED',
      'The GitHub App is not installed on acme/app.',
    ]);

    // No provider issues for it.
    next = () => Promise.resolve(null);
    expect((await reasonOf()).slice(0, 2)).toEqual([403, 'REPO_ACCESS_DENIED']);

    // An unexplained failure is logged and answered without its detail.
    next = () =>
      Promise.reject(new Error('socket hang up: synthetic-internal-detail'));
    const broken = await reasonOf();
    expect(broken.slice(0, 2)).toEqual([503, 'REPO_ACCESS_UNAVAILABLE']);
    expect(String(broken[2])).not.toContain('synthetic-internal-detail');

    // An expired or incomplete credential is never handed out.
    next = () =>
      Promise.resolve({
        username: 'x-access-token',
        password: 'synthetic-stale',
        expiresAt: '2026-10-01T00:00:00.000Z',
      });
    expect((await reasonOf()).slice(0, 2)).toEqual([
      503,
      'REPO_ACCESS_UNAVAILABLE',
    ]);
  });

  it('stops waiting for a slow application, and aborts its call', async () => {
    h = await createHarness();
    repos(APP);
    let aborted = false;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      provide({
        issue: (request) =>
          new Promise((resolve) => {
            request.signal.addEventListener('abort', () => {
              aborted = true;
              resolve(null);
            });
          }),
      });
      const { runner, payload } = await claimedOnDemand();
      const pending = ask(runner, payload.run.id, { attempt: 1, url: APP });
      await vi.advanceTimersByTimeAsync(15_000);
      const answer = await pending;
      expect(answer.status).toBe(503);
      expect(answer.body.error.reason).toBe('REPO_ACCESS_UNAVAILABLE');
      expect(aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('redacts every credential it issued from what the run reports, and stores why a repository was not pushed', async () => {
    h = await createHarness();
    repos(APP);
    provide();
    const { runner, payload } = await claimedOnDemand();
    const runId = payload.run.id as string;
    const post = (action: string, body: unknown) =>
      h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
        runnerKey: runner.key,
        body,
      });
    const first = (await ask(runner, runId, { attempt: 1, url: APP })).body.data
      .password as string;
    const second = (
      await ask(runner, runId, { attempt: 1, url: APP, refresh: true })
    ).body.data.password as string;
    await post('start', start);
    await post('events', {
      events: [
        {
          seq: 1,
          at: '2026-10-01T00:00:01.000Z',
          type: 'text',
          content: `old ${first} new ${second}`,
        },
      ],
    });
    const page = await h.services.runs.events(runId, 0, 10);
    expect(page.events[0]?.content).toBe('old [REDACTED] new [REDACTED]');

    await post('complete', {
      summary: 'Done.',
      handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
      repos: [
        {
          url: APP,
          branch: 'agent/SMP-1',
          pushed: false,
          failure: {
            reason: 'authFailed',
            message: `The remote refused ${second}.`,
          },
        },
      ],
    });
    const detail = await h.services.runs.detail(runId);
    expect(detail?.repos).toMatchObject([
      {
        url: APP,
        pushed: false,
        failure: {
          reason: 'authFailed',
          message: 'The remote refused [REDACTED].',
        },
      },
    ]);
  });
});
