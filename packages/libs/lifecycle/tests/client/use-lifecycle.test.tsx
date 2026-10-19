// The hook against the real routes: a page's view of one record.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createLifecycleClient,
  createLifecycleHook,
  LifecycleRequestError,
  useLifecycle,
} from '../../src/react.js';
import { routesApp } from '../support/routes-app.js';

function setup(actor: string) {
  const app = routesApp();
  const client = createLifecycleClient({
    transport: app.transport(actor),
    basePath: '/',
  });
  return { ...app, client };
}

describe('useLifecycle', () => {
  it('loads the record and its description, and nothing while none is selected', async () => {
    const { client, id } = setup('agent');
    const { result, rerender } = renderHook(
      ({ selected }: { selected: string | undefined }) =>
        useLifecycle(client, 'tickets', selected, { refreshMs: 0 }),
      { initialProps: { selected: undefined as string | undefined } },
    );
    await waitFor(() => expect(result.current.description).toBeDefined());
    expect(result.current.view).toBeUndefined();
    rerender({ selected: id });
    await waitFor(() =>
      expect(result.current.view?.record.status).toBe('open'),
    );
    expect(result.current.description?.diagram).toContain('stateDiagram-v2');
  });

  it('fires with the version on screen and shows the record as it left it', async () => {
    const { client, id, sent } = setup('agent');
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    await act(async () => {
      await result.current.fire('replyToCustomer', { message: 'Hello' });
    });
    expect(result.current.view).toMatchObject({
      state: 'awaitingCustomer',
      version: 1,
    });
    expect(sent).toEqual(['a@example.com']);
  });

  it('rejects a refused fire with its reasons', async () => {
    const { client, id } = setup('stranger');
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    let refusal: unknown;
    await act(async () => {
      refusal = await result.current.fire('close').catch((error) => error);
    });
    expect(refusal).toBeInstanceOf(LifecycleRequestError);
    expect(refusal).toMatchObject({
      reason: 'GUARD_REJECTED',
      blockers: [{ source: 'guard', kind: 'permission' }],
    });
    expect(result.current.busy).toBe(false);
  });

  it('refuses a fire made on a screen that is out of date', async () => {
    const { client, id, runtime } = setup('agent');
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    // Someone else replies while this page still shows version 0.
    await runtime.fire('tickets', id, 'replyToCustomer', {
      actor: { id: 'agent' },
      input: { message: 'First' },
    });
    let refusal: unknown;
    await act(async () => {
      refusal = await result.current.fire('close').catch((error) => error);
    });
    expect(refusal).toMatchObject({ reason: 'CONFLICT' });
  });
});

describe('continueRun', () => {
  it('fires a waiting continuation through its route, and answers why when none waits', async () => {
    const { client, id, store } = setup('agent');
    // A run whose `close` continuation waits, as a refused one would.
    const waiting = await store.createEffectRun({
      transitionId: '0',
      lifecycle: 'tickets',
      recordId: id,
      effect: 'tickets.notifyCustomer',
      status: 'succeeded',
      attempts: 1,
      maxAttempts: 3,
      result: {},
      error: null,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
      claimedAt: null,
      runAfter: null,
      stayBound: true,
      continuation: {
        transition: 'close',
        outcome: 'succeeded',
        input: {},
        error: 'Not yet.',
        code: 'INVALID_SET',
        attempts: 1,
        errorTries: 0,
        failedAt: '2026-10-01T09:00:00.000Z',
        dueAt: '2026-10-01T09:01:00.000Z',
        abandonedAt: null,
      },
    });
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    await act(async () => {
      await result.current.continueRun(waiting.id);
    });
    expect(result.current.view).toMatchObject({ state: 'closed' });
    expect(
      result.current.view?.history.effectRuns.find(
        (run) => run.id === waiting.id,
      ),
    ).toMatchObject({ continuation: null });

    let refusal: unknown;
    await act(async () => {
      refusal = await result.current
        .continueRun(waiting.id)
        .catch((error: unknown) => error);
    });
    expect(refusal).toBeInstanceOf(LifecycleRequestError);
    expect(refusal).toMatchObject({ reason: 'NO_CONTINUATION' });
  });
});

describe('createLifecycleHook', () => {
  it('serves a page with one call, and keeps its client while the query is unchanged', async () => {
    const { id, transport } = routesApp();
    // A real application's useApiClient returns one client for the app's lifetime.
    const agent = transport('agent');
    const useTicket = createLifecycleHook({
      useTransport: () => agent,
      basePath: '/',
      refreshMs: 0,
    });
    const { result, rerender } = renderHook(
      ({ actAs }: { actAs: string }) =>
        // A query written inline, as a page would.
        useTicket('tickets', id, { actAs }),
      { initialProps: { actAs: 'agent' } },
    );
    await waitFor(() =>
      expect(result.current.view?.record.status).toBe('open'),
    );
    const first = result.current.client;
    rerender({ actAs: 'agent' });
    expect(result.current.client).toBe(first);
    rerender({ actAs: 'customer' });
    expect(result.current.client).not.toBe(first);
  });

  it('fires through the configured routes', async () => {
    const { id, transport, sent } = routesApp();
    // A real application's useApiClient returns one client for the app's lifetime.
    const agent = transport('agent');
    const useTicket = createLifecycleHook({
      useTransport: () => agent,
      basePath: '/',
      refreshMs: 0,
    });
    const { result } = renderHook(() => useTicket('tickets', id));
    await waitFor(() => expect(result.current.view).toBeDefined());
    await act(async () => {
      await result.current.fire('replyToCustomer', { message: 'Hello' });
    });
    expect(result.current.view?.state).toBe('awaitingCustomer');
    expect(sent).toEqual(['a@example.com']);
  });
});

describe('scheduled snapshot refreshes', () => {
  afterEach(() => vi.useRealTimers());

  it('propagates refresh errors and HTTP status while keeping reload compatible', async () => {
    const { client, id } = setup('agent');
    const view = vi.spyOn(client, 'view');
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    const failure = Object.assign(new Error('Forbidden'), { status: 403 });
    view.mockRejectedValue(failure);
    await act(async () => {
      await expect(result.current.refresh()).rejects.toBe(failure);
    });
    expect(result.current.error).toBe(failure);
    expect(result.current.view).toBeUndefined();
    await act(async () => {
      await expect(result.current.reload()).resolves.toBeUndefined();
    });

    const transport = {
      request: async <T,>(): Promise<T> => {
        throw Object.assign(new Error('Forbidden'), {
          status: 403,
          payload: { error: { message: 'Forbidden', reason: 'FORBIDDEN' } },
        });
      },
    };
    await expect(
      createLifecycleClient({ transport, basePath: '/' }).view('tickets', id),
    ).rejects.toMatchObject({ status: 403, reason: 'FORBIDDEN' });
  });

  it('forwards cancellation and ignores responses after a record or account switch', async () => {
    const { client, id } = setup('agent');
    const snapshot = await client.view('tickets', id);
    const pending: {
      resolve: (value: typeof snapshot) => void;
      signal?: AbortSignal;
    }[] = [];
    vi.spyOn(client, 'view').mockImplementation(
      (_name, _id, options) =>
        new Promise((resolve) => {
          pending.push({ resolve, signal: options?.signal });
        }),
    );
    const { result, rerender, unmount } = renderHook(
      ({ name }) => useLifecycle(client, name, id, { refreshMs: 0 }),
      { initialProps: { name: 'tickets' } },
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    rerender({ name: 'other' });
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(pending[0].signal?.aborted).toBe(true);
    await act(async () => {
      pending[1].resolve({ ...snapshot, state: 'new' });
    });
    await act(async () => {
      pending[0].resolve(snapshot);
    });
    expect(result.current.view?.state).toBe('new');
    const controller = new AbortController();
    let reading!: Promise<void>;
    act(() => {
      reading = result.current.refresh(controller.signal);
    });
    controller.abort();
    expect(pending[2].signal?.aborted).toBe(true);
    await act(async () => {
      pending[2].resolve(snapshot);
      await reading;
    });
    expect(result.current.view?.state).toBe('new');
    act(() => {
      reading = result.current.refresh();
    });
    unmount();
    expect(pending[3].signal?.aborted).toBe(true);
    pending[3].resolve(snapshot);
    await reading;
  });

  it('does not let an older snapshot replace a completed action', async () => {
    const { client, id } = setup('agent');
    const { result } = renderHook(() =>
      useLifecycle(client, 'tickets', id, { refreshMs: 0 }),
    );
    await waitFor(() => expect(result.current.view).toBeDefined());
    const before = result.current.view!;
    let finish!: (value: typeof before) => void;
    vi.spyOn(client, 'view').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let reading!: Promise<void>;
    act(() => {
      reading = result.current.refresh();
    });
    await act(async () => {
      await result.current.fire('replyToCustomer', { message: 'Hello' });
    });
    await act(async () => {
      finish(before);
      await reading;
    });
    expect(result.current.view?.state).toBe('awaitingCustomer');
  });

  it('keeps displaying slow successful reads with the default polling interval', async () => {
    const { client, id } = setup('agent');
    const snapshot = await client.view('tickets', id);
    vi.useFakeTimers();
    let version = 0;
    const view = vi.spyOn(client, 'view').mockImplementation(() => {
      const next = { ...snapshot, version: ++version };
      return new Promise((resolve) => setTimeout(() => resolve(next), 6_000));
    });
    const { result } = renderHook(() => useLifecycle(client, 'tickets', id));
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(result.current.view?.version).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(8_000));
    expect(result.current.view?.version).toBe(2);
    expect(view).toHaveBeenCalledTimes(2);
  });

  it('keeps the default four-second interval and allows opting out', async () => {
    vi.useFakeTimers();
    const { client, id } = setup('agent');
    const view = vi.spyOn(client, 'view');
    const { rerender } = renderHook(
      ({ refreshMs }: { refreshMs?: number }) =>
        useLifecycle(client, 'tickets', id, { refreshMs }),
      { initialProps: {} as { refreshMs?: number } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(view).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(view).toHaveBeenCalledTimes(2);
    rerender({ refreshMs: 0 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    view.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(view).not.toHaveBeenCalled();
  });
});
