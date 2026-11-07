import { afterEach, describe, expect, it } from 'vitest';
import { RepoAccessError } from '../server/tokens.js';
import { claim, createHarness, type Harness } from './harness.js';

describe('repository preparation recovery', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });
  async function setup() {
    h = await createHarness();
    h.dirs = [
      {
        kind: 'repo',
        url: 'https://github.test/acme/app.git',
        defaultBranch: 'main',
        branch: 'agent/sample',
        path: 'app',
      },
    ];
    const agent = await h.createAgent();
    const runId = await h.enqueue(agent);
    const runner = await h.registerRunner();
    let failure: Error | undefined;
    h.services.repoAccess.register({
      key: 'fake-host',
      forRun: async () => {
        if (failure) throw failure;
        return null;
      },
    });
    return {
      runId,
      runner,
      fail: (error?: Error) => {
        failure = error;
      },
    };
  }
  const outage = (code = 'timeout', retryAt?: string) =>
    new RepoAccessError('unavailable', 'Safe host diagnostic.', {
      code,
      host: 'github.com',
      phase: 'permission',
      ...(retryAt ? { retryAt } : {}),
    });
  it.each(['timeout', 'network', 'serverError', 'rateLimited'])(
    'defers %s and starts the same input after recovery',
    async (code) => {
      const s = await setup();
      const retryAt = new Date(h.clock.now().getTime() + 120_000).toISOString();
      s.fail(outage(code, code === 'rateLimited' ? retryAt : undefined));
      expect(await claim(h, s.runner)).toEqual([]);
      const run = await h.services.runs.get(s.runId);
      expect(run).toMatchObject({
        status: 'queued',
        attempt: 1,
        startedAt: null,
        runnerId: null,
        failureReason: 'repoAccessUnavailable',
        failureParams: { code, repoFailures: 1 },
      });
      const delay = code === 'rateLimited' ? 120_000 : 60_000;
      expect(Date.parse(run.availableAt!) - h.clock.now().getTime()).toBe(
        delay,
      );
      expect(await claim(h, s.runner)).toEqual([]);
      s.fail();
      h.clock.advance(delay);
      const [payload] = await claim(h, s.runner);
      expect(payload!.run).toMatchObject({ id: s.runId, attempt: 1 });
      expect(payload!.inputs).toHaveLength(1);
      expect(await h.services.runs.get(s.runId)).toMatchObject({
        failureParams: null,
        failureReason: null,
      });
    },
  );
  it('keeps both budgets after an ordinary preparation failure, then a network outage', async () => {
    const s = await setup();
    s.fail(new Error('Invalid assembly'));
    await claim(h, s.runner);
    s.fail(outage());
    for (const delay of [1, 2, 4, 8, 15]) {
      await claim(h, s.runner);
      expect((await h.services.runs.get(s.runId)).status).toBe('queued');
      h.clock.advance(delay * 60_000);
    }
    await claim(h, s.runner);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'failed',
      failureReason: 'repoAccessUnavailable',
      failureParams: { repoFailures: 6 },
    });
  });
  it('still ends ordinary failures on the third one after a repository retry', async () => {
    const s = await setup();
    s.fail(new Error('Invalid assembly'));
    await claim(h, s.runner);
    s.fail(outage());
    await claim(h, s.runner);
    h.clock.advance(60_000);
    s.fail(new Error('Invalid assembly'));
    await claim(h, s.runner);
    expect((await h.services.runs.get(s.runId)).status).toBe('queued');
    await claim(h, s.runner);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'failed',
      failureReason: 'setupFailed',
      failureParams: null,
    });
  });
  it('ends a refusal immediately without dispatch or occupancy', async () => {
    const s = await setup();
    s.fail(
      new RepoAccessError('denied', 'No permission.', {
        code: 'pushPermissionMissing',
      }),
    );
    await claim(h, s.runner);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'failed',
      runnerId: null,
      startedAt: null,
      failureReason: 'repoAccessDenied',
      failureParams: { code: 'pushPermissionMissing' },
    });
    expect(h.finished.map((r) => r.id)).toEqual([s.runId]);
  });
  it('ends a rate limit exceeding the one-hour preparation window', async () => {
    const s = await setup();
    s.fail(
      outage(
        'rateLimited',
        new Date(h.clock.now().getTime() + 3_660_000).toISOString(),
      ),
    );
    await claim(h, s.runner);
    expect((await h.services.runs.get(s.runId)).status).toBe('failed');
  });
  it('never revives a cancelled deferred run and releases its queue work', async () => {
    const s = await setup();
    s.fail(outage());
    await claim(h, s.runner);
    await h.services.runs.cancel(s.runId, 'owner');
    h.clock.advance(60_000);
    s.fail();
    expect(await claim(h, s.runner)).toEqual([]);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'cancelled',
      availableAt: null,
      leaseExpiresAt: null,
      runnerId: null,
    });
  });
  it('does not write a stale failure when cancellation happens during external preparation', async () => {
    const s = await setup();
    h.services.repoAccess.register({
      key: 'cancel-during-prepare',
      prepare: async () => {
        await h.services.runs.cancel(s.runId, 'owner');
        return null;
      },
      forRun: async () => null,
    });
    s.fail(outage());
    await claim(h, s.runner);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'cancelled',
      failureParams: null,
      availableAt: null,
    });
  });
  it('counts one failed preparation when two runners race for the same candidate', async () => {
    const s = await setup();
    const other = await h.registerRunner();
    s.fail(outage());
    await Promise.all([claim(h, s.runner), claim(h, other)]);
    expect(await h.services.runs.get(s.runId)).toMatchObject({
      status: 'queued',
      failureParams: { repoFailures: 1 },
      runnerId: null,
    });
  });
});
