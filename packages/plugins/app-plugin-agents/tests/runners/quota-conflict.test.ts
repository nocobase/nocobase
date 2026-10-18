import { PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { afterEach, expect, it, vi } from 'vitest';
import { createHarness, claim, type Harness } from './harness.js';
import { DefaultRepository } from '../../../../libs/db/src/repository/repository.js';
import {
  ApiClient,
  ApiError,
} from '../../../../app/agent-runner/src/lib/http.ts';
import { RunWorker } from '../../../../app/agent-runner/src/agent/worker.ts';

let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});

/** Inject the losing CAS result, retaining the real transaction and HTTP error rendering. */
function loseRevisionOnce() {
  const original = DefaultRepository.prototype.updateMany;
  let injected = false;
  vi.spyOn(DefaultRepository.prototype, 'updateMany').mockImplementation(
    async function (options) {
      if (!injected && options.values && 'quotaRevision' in options.values) {
        injected = true;
        return { updatedCount: 0 };
      }
      return original.call(this, options);
    },
  );
  return () => expect(injected).toBe(true);
}

function client(
  headers: Record<string, string>,
  responses: number[],
  bodies: unknown[],
) {
  return new ApiClient({
    server: 'http://test/',
    headers: { 'x-nocobase-protocol': String(PROTOCOL_VERSION), ...headers },
    fetch: async (url, init) => {
      bodies.push(JSON.parse(String(init?.body)) as unknown);
      const response = await h.app.request(
        new URL(String(url)).pathname.replace(/^\/api(?=\/)/u, ''),
        init,
      );
      responses.push(response.status);
      return response;
    },
  });
}

it('retries the original model-unavailable final report through HTTP after a losing revision update', async () => {
  h = await createHarness();
  const agent = await h.createAgent({
    modelEntries: [{ tool: 'claude', model: 'a' }],
  });
  const runner = await h.registerRunner({
    tools: [{ kind: 'claude', authenticated: true, models: [{ id: 'a' }] }],
  });
  const runId = await h.enqueue(agent);
  await claim(h, runner);
  const injected = loseRevisionOnce();
  const responses: number[] = [];
  const bodies: unknown[] = [];
  const log = vi.fn();
  const worker: RunWorker = Object.create(RunWorker.prototype);
  Object.assign(worker, {
    runId,
    client: client({ 'x-nocobase-runner-key': runner.key }, responses, bodies),
    timings: {},
    deps: { log },
    delivered: new Set(),
    usage: [],
    redactor: { text: (value: string) => value },
    updateRecord: vi.fn(async () => {}),
    repoReports: vi.fn(async () => []),
    saveLocal: vi.fn(async () => ''),
    drainEvents: vi.fn(async () => {}),
  });
  expect(
    await worker['finishFailed'](
      'modelUnavailable',
      'Model no longer offered.',
    ),
  ).toBe('failed');
  injected();
  expect(responses).toEqual([409, 200]);
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toEqual(bodies[1]);
  expect(bodies[1]).toMatchObject({
    reason: 'modelUnavailable',
    detail: 'Model no longer offered.',
  });
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('REVISION_CONFLICT'),
  );
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toMatchObject([{ tool: 'claude', model: 'a' }]);
  expect((await h.services.runs.get(runId)).failureReason).toBe(
    'modelUnavailable',
  );
});

it('returns a retryable heartbeat cleanup conflict and preserves the mark until the next heartbeat succeeds', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  await h.services.tx.run((unit) =>
    h.services.runners.markModelUnavailable(
      unit,
      runner.runnerId,
      'claude',
      'a',
    ),
  );
  const before = await h.services.runners.get(runner.runnerId);
  const body = {
    version: before.version,
    features: before.features,
    tools: [{ kind: 'claude', authenticated: true, models: [{ id: 'a' }] }],
    active: [],
    load: { slots: 1, free: 1 },
  };
  const responses: number[] = [];
  const api = client({ 'x-nocobase-runner-key': runner.key }, responses, []);
  const injected = loseRevisionOnce();
  const error = await api
    .request('POST', 'agents/runners/heartbeat', body)
    .catch((error: unknown) => error);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    status: 409,
    reason: 'REVISION_CONFLICT',
    transient: true,
  });
  injected();
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toEqual(before.unavailableModels);
  expect((await h.services.runners.get(runner.runnerId)).quotaRevision).toBe(
    before.quotaRevision,
  );
  await api.request('POST', 'agents/runners/heartbeat', body);
  expect(responses).toEqual([409, 200]);
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toEqual([]);
});

it('does not retry a known-reset clear business conflict through the same worker report loop', async () => {
  h = await createHarness();
  const runner = await h.registerRunner({ ownerUserId: 'alice' });
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, runner.runnerId, 'claude', null, {
      windows: [
        {
          scope: 'tool',
          target: '',
          window: '5h',
          exhausted: true,
          resetsAt: '2026-10-01T01:00:00.000Z',
        },
      ],
    }),
  );
  const responses: number[] = [];
  const worker: RunWorker = Object.create(RunWorker.prototype);
  const log = vi.fn();
  Object.assign(worker, {
    runId: 'clear',
    timings: {},
    deps: { log },
    client: client({ 'x-test-user': 'alice' }, responses, []),
  });
  await expect(
    worker['report'](`agents/runners/${runner.runnerId}/quota/clear`, {
      tool: 'claude',
      scope: 'tool',
      target: '',
      window: '5h',
    }),
  ).rejects.toMatchObject({
    status: 400,
    reason: 'QUOTA_RESET_KNOWN',
    transient: false,
  });
  expect(responses).toEqual([400]);
  expect(log).not.toHaveBeenCalled();
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toHaveLength(1);
});
