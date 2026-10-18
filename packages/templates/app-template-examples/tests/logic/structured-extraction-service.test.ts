// @vitest-environment node
import type {
  OnlineAgent,
  OnlineAgentContext,
} from '@nocobase/app-plugin-agents/server/online-agent';
import { ApiError } from '@nocobase/app-server/router';
import type { ModelCatalog } from '@nocobase/app-plugin-agents/shared/models';
import { afterEach, expect, it, vi } from 'vitest';
import { StructuredExtractionService } from '../../server/providers/structured-extraction-service.js';

const model = { modelService: 'fixture', model: 'chat' };
const input = {
  text: 'Source facts',
  model,
  schema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
};
const actor: OnlineAgentContext = {
  user: { id: 'person' },
  credentials: {
    user: { id: 'person' },
    session: { token: 'whole-credential' },
  },
  authorization: {
    identity: { principal: { type: 'user', id: 'person' } },
  } as OnlineAgentContext['authorization'],
};
const catalog: ModelCatalog = {
  services: [
    {
      name: 'fixture',
      title: 'Fixture',
      provider: 'openai-compatible',
      models: [
        { value: 'chat', label: 'Chat', kind: 'chat', dimensions: null },
      ],
    },
  ],
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
const never = () => new Promise<never>(() => {});
function setup() {
  vi.useFakeTimers();
  const session = {
    sessionId: 'private-session',
    run: vi.fn(async () => {}),
    status: vi.fn(async () => 'idle' as 'running' | 'idle'),
    get: vi.fn(async () => ({ name: 'Ada' })),
    abort: vi.fn(async () => {}),
    history: vi.fn(async () => []),
    send: vi.fn(async () => 1),
    retryFinalization: vi.fn(async () => {}),
  } satisfies OnlineAgent;
  const deps = {
    onlineAgent: { background: vi.fn(async () => session as OnlineAgent) },
    catalog: vi.fn(async () => catalog),
    onError: vi.fn(),
  };
  const service = new StructuredExtractionService(deps, {
    deadlineMs: 1_000,
    pollMs: 250,
    cleanupMs: 20,
  });
  return { service, session, deps };
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('waits beyond admission with bounded status polling, then reads only the successful result', async () => {
  const { service, session, deps } = setup();
  session.status
    .mockResolvedValueOnce('running')
    .mockResolvedValueOnce('running')
    .mockResolvedValueOnce('idle');
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, 'removeEventListener');
  const pending = service.extract(actor, input, controller.signal);
  await vi.advanceTimersByTimeAsync(0);
  expect(session.run).toHaveBeenCalledOnce();
  expect(session.get).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(249);
  expect(session.status).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(251);
  expect(await pending).toEqual({ name: 'Ada' });
  expect(session.get).toHaveBeenCalledOnce();
  expect(session.history).not.toHaveBeenCalled();
  expect(session.abort).not.toHaveBeenCalled();
  expect(deps.onlineAgent.background).toHaveBeenCalledWith(
    actor,
    expect.anything(),
  );
  expect(remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['catalog', 'background', 'run', 'status', 'get'] as const)(
  'bounds a stalled %s and uncooperative cancellation without leaking timers/listeners',
  async (phase) => {
    const { service, session, deps } = setup();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    if (phase === 'catalog') deps.catalog.mockImplementation(never);
    if (phase === 'background')
      deps.onlineAgent.background.mockImplementation(never);
    if (phase === 'run') session.run.mockImplementation(never);
    if (phase === 'status') session.status.mockImplementation(never);
    if (phase === 'get') session.get.mockImplementation(never);
    session.abort.mockImplementation(never);
    const result = service
      .extract(actor, input, controller.signal)
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1_020);
    expect(await result).toMatchObject({
      reason: 'EXTRACTION_TIMEOUT',
      status: 'DEADLINE_EXCEEDED',
    });
    expect(remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    if (phase !== 'catalog' && phase !== 'background')
      expect(session.abort).toHaveBeenCalled();
  },
);

it.each(['deadline', 'disconnect'] as const)(
  'never starts run when background creation completes after %s; observes late abort rejection',
  async (cause) => {
    const { service, session, deps } = setup();
    const opened = deferred<OnlineAgent>();
    deps.onlineAgent.background.mockReturnValue(opened.promise);
    const controller = new AbortController();
    const error = new Error('Provider refuses cancellation.');
    session.abort.mockRejectedValue(error);
    const result = service
      .extract(actor, input, controller.signal)
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    if (cause === 'deadline') await vi.advanceTimersByTimeAsync(1_000);
    else controller.abort();
    expect(await result).toMatchObject({
      reason:
        cause === 'deadline' ? 'EXTRACTION_TIMEOUT' : 'EXTRACTION_CANCELLED',
    });
    opened.resolve(session);
    await vi.advanceTimersByTimeAsync(0);
    expect(session.run).not.toHaveBeenCalled();
    expect(session.abort).toHaveBeenCalled();
    expect(deps.onError).toHaveBeenCalledWith(error);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it('checks an already disconnected request before opening a session', async () => {
  const { service, deps } = setup();
  const controller = new AbortController();
  controller.abort();
  await expect(
    service.extract(actor, input, controller.signal),
  ).rejects.toMatchObject({ reason: 'EXTRACTION_CANCELLED' });
  expect(deps.catalog).not.toHaveBeenCalled();
  expect(deps.onlineAgent.background).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('rechecks the wall deadline before admission even if its timer has not fired', async () => {
  const { service, session, deps } = setup();
  const opened = deferred<OnlineAgent>();
  deps.onlineAgent.background.mockReturnValue(opened.promise);
  const result = service.extract(actor, input).catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(0);
  vi.setSystemTime(Date.now() + 1_001);
  opened.resolve(session);
  await vi.advanceTimersByTimeAsync(0);
  expect(await result).toMatchObject({ reason: 'EXTRACTION_TIMEOUT' });
  expect(session.run).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('requests cancellation again when late admission settles after an early abort', async () => {
  const { service, session } = setup();
  const admitted = deferred<void>();
  session.run.mockReturnValue(admitted.promise);
  const result = service.extract(actor, input).catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(await result).toMatchObject({ reason: 'EXTRACTION_TIMEOUT' });
  const aborted = session.abort.mock.calls.length;
  admitted.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(session.abort.mock.calls.length).toBeGreaterThan(aborted);
  expect(session.get).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it.each([
  ['background', 403, 'EXTRACTION_FORBIDDEN'],
  ['background', 'PERMISSION_DENIED', 'EXTRACTION_FORBIDDEN'],
  ['background', 400, 'INVALID_MODEL'],
  ['run', 400, 'INVALID_SCHEMA'],
  ['run', 'INVALID_ARGUMENT', 'INVALID_SCHEMA'],
  ['get', 409, 'EXTRACTION_FAILED'],
  ['run', undefined, 'EXTRACTION_FAILED'],
] as const)(
  'maps safe public %s status %s to %s, logging only the real diagnostic',
  async (phase, status, reason) => {
    const { service, deps, session } = setup();
    const error = Object.assign(new Error('SECRET_PROVIDER_MESSAGE'), {
      status,
    });
    if (phase === 'background')
      deps.onlineAgent.background.mockRejectedValue(error);
    else session[phase].mockRejectedValue(error);
    const result = service
      .extract(actor, input)
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    expect(await result).toMatchObject({ reason, domain: 'examples' });
    expect(String(await result)).not.toContain('SECRET_PROVIDER_MESSAGE');
    expect(deps.onError).toHaveBeenCalledWith(error);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it('observes abort failures without replacing the safe execution error', async () => {
  const { service, session, deps } = setup();
  const failure = new Error('Failed persisted result.');
  const cancellation = new Error('Failed abort.');
  session.get.mockRejectedValue(failure);
  session.abort.mockRejectedValue(cancellation);
  await expect(service.extract(actor, input)).rejects.toMatchObject({
    reason: 'EXTRACTION_FAILED',
  });
  expect(deps.onError).toHaveBeenCalledWith(failure);
  expect(deps.onError).toHaveBeenCalledWith(cancellation);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not pass through an upstream ApiError or its provider message', async () => {
  const { service, session, deps } = setup();
  const error = new ApiError({
    status: 'UNAVAILABLE',
    domain: 'provider',
    reason: 'PROVIDER_FAILURE',
    message: 'SECRET_PROVIDER_MESSAGE',
  });
  session.get.mockRejectedValue(error);
  await expect(service.extract(actor, input)).rejects.toMatchObject({
    domain: 'examples',
    reason: 'EXTRACTION_FAILED',
    message: 'Structured extraction could not be completed.',
  });
  expect(deps.onError).toHaveBeenCalledWith(error);
  expect(vi.getTimerCount()).toBe(0);
});
