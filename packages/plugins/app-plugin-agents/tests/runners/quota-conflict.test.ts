import { afterEach, expect, it, vi } from 'vitest';
import { createHarness, claim, type Harness } from './harness.js';
let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});

/** Inject one losing CAS result through the repository's public runtime instance. */
function loseRevisionOnce() {
  const prototype = Object.getPrototypeOf(
    h.services.tx.read().repository('agRunners'),
  );
  const original = prototype.updateMany;
  let injected = false;
  vi.spyOn(prototype, 'updateMany').mockImplementation(async function (
    this: unknown,
    options: any,
  ) {
    if (!injected && options.values && 'quotaRevision' in options.values) {
      injected = true;
      return { updatedCount: 0 };
    }
    return original.call(this, options);
  });
  return () => expect(injected).toBe(true);
}

it('returns REVISION_CONFLICT for a losing model-unavailable report and preserves its classification on replay', async () => {
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
  const body = {
    reason: 'modelUnavailable',
    detail: 'Model no longer offered.',
  };
  const route = `/agents/runners/runs/${runId}/fail`;
  const losing = await h.request('POST', route, {
    runnerKey: runner.key,
    body,
  });
  expect(losing.status).toBe(409);
  expect(losing.body.error).toMatchObject({
    status: 'ABORTED',
    reason: 'REVISION_CONFLICT',
  });
  injected();
  expect((await h.services.runs.get(runId)).failureReason).not.toBe(
    'modelUnavailable',
  );
  const saved = await h.request('POST', route, { runnerKey: runner.key, body });
  expect(saved.status).toBe(200);
  expect((await h.services.runs.get(runId)).failureReason).toBe(
    'modelUnavailable',
  );
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toMatchObject([{ tool: 'claude', model: 'a' }]);
});

it('returns REVISION_CONFLICT for heartbeat cleanup, retaining the mark until replay succeeds', async () => {
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
  const injected = loseRevisionOnce();
  const losing = await h.request('POST', '/agents/runners/heartbeat', {
    runnerKey: runner.key,
    body,
  });
  expect(losing.status).toBe(409);
  expect(losing.body.error).toMatchObject({
    status: 'ABORTED',
    reason: 'REVISION_CONFLICT',
  });
  injected();
  const retained = await h.services.runners.get(runner.runnerId);
  expect(retained.unavailableModels).toEqual(before.unavailableModels);
  expect(retained.quotaRevision).toBe(before.quotaRevision);
  const saved = await h.request('POST', '/agents/runners/heartbeat', {
    runnerKey: runner.key,
    body,
  });
  expect(saved.status).toBe(200);
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toEqual([]);
});
