import { afterEach, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from '../src/lib/http.ts';
import { RunWorker } from '../src/agent/worker.ts';

afterEach(() => vi.restoreAllMocks());

it('retries the unchanged model-unavailable report after a revision conflict', async () => {
  const runId = 'original';
  const bodies: unknown[] = [];
  const log = vi.fn();
  const api = new ApiClient({
    server: 'http://test/',
    headers: {},
    fetch: async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return bodies.length === 1
        ? Response.json(
            {
              error: {
                code: 409,
                status: 'ABORTED',
                reason: 'REVISION_CONFLICT',
                domain: 'agents',
                message: 'Revision changed.',
              },
            },
            { status: 409 },
          )
        : Response.json({ data: {} });
    },
  });
  const worker: RunWorker = Object.create(RunWorker.prototype);
  Object.assign(worker, {
    runId,
    client: api,
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
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toEqual(bodies[1]);
  expect(bodies[1]).toMatchObject({
    reason: 'modelUnavailable',
    detail: 'Model no longer offered.',
  });
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('REVISION_CONFLICT'),
  );
});

it.each([
  [409, 'CONFLICT', 'ABORTED'],
  [400, 'QUOTA_RESET_KNOWN', 'FAILED_PRECONDITION'],
] as const)(
  'does not retry HTTP %s business error %s',
  async (status, reason, apiStatus) => {
    const fetch = vi.fn(async () =>
      Response.json(
        {
          error: {
            code: status,
            status: apiStatus,
            reason,
            domain: 'agents',
            message: 'Business precondition.',
          },
        },
        { status },
      ),
    );
    const worker: RunWorker = Object.create(RunWorker.prototype);
    const log = vi.fn();
    Object.assign(worker, {
      runId: 'report',
      timings: {},
      deps: { log },
      client: new ApiClient({ server: 'http://test/', headers: {}, fetch }),
    });
    await expect(
      worker['report']('agents/runners/runs/report/fail', {
        reason: 'modelUnavailable',
      }),
    ).rejects.toMatchObject({ status, reason, transient: false });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  },
);

it('exposes heartbeat revision conflicts as retryable without an implicit client retry', async () => {
  const fetch = vi.fn(async () =>
    Response.json(
      {
        error: {
          code: 409,
          status: 'ABORTED',
          reason: 'REVISION_CONFLICT',
          domain: 'agents',
          message: 'Revision changed.',
        },
      },
      { status: 409 },
    ),
  );
  const api = new ApiClient({ server: 'http://test/', headers: {}, fetch });
  const error = await api
    .request('POST', 'agents/runners/heartbeat', {})
    .catch((error: unknown) => error);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    status: 409,
    reason: 'REVISION_CONFLICT',
    transient: true,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
