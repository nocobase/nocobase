// The hook against the real routes: a page's view of one record.
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
