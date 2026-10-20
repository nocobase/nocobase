import {
  ClientApplicationContext,
  realtimeClientToken,
  type ClientApplication,
} from '@nocobase/app-client';
import { ServiceContainer } from '@nocobase/service-provider';
import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  AuthenticationProvider,
  useAuthentication,
  type AuthenticationContextValue,
} from '../../auth-provider.js';
import { authenticationClientToken } from '../../tokens.js';

afterEach(() => vi.useRealTimers());

async function setup(active: boolean | 'uncreated' | 'absent' = true) {
  let session: unknown = {
    user: { id: 'alice' },
    session: { id: 'session-1' },
  };
  const getSession = vi.fn(async () => ({ data: session }));
  const listeners = new Set<() => void>();
  const realtime = {
    active,
    reconnect: vi.fn(),
    onOpen: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  const services = new ServiceContainer();
  services.instance(authenticationClientToken, { getSession } as never);
  const createRealtime = vi.fn(() => realtime as never);
  if (active === 'uncreated')
    services.singleton(realtimeClientToken, createRealtime);
  else if (active !== 'absent')
    services.instance(realtimeClientToken, realtime as never);
  let auth!: AuthenticationContextValue;
  function Capture() {
    auth = useAuthentication();
    return <span>{auth.isPending ? 'querying' : auth.preparation}</span>;
  }
  const tree = render(
    <ClientApplicationContext.Provider
      value={{ services } as unknown as ClientApplication}
    >
      <AuthenticationProvider>
        <Capture />
      </AuthenticationProvider>
    </ClientApplicationContext.Provider>,
  );
  await act(async () => {});
  return {
    ...tree,
    realtime,
    listeners,
    getSession,
    createRealtime,
    auth: () => auth,
    open: () => {
      for (const listener of listeners) listener();
    },
    change: async (next: unknown) => {
      session = next;
      await act(async () => auth.refresh());
    },
  };
}

it('waits for all synchronous open listeners and prepares cookie startup once', async () => {
  const probe = await setup();
  expect(screen.getByText('preparing')).toBeInTheDocument();
  expect(probe.realtime.reconnect).toHaveBeenCalledOnce();
  const invalidated = vi.fn(() =>
    expect(probe.auth().preparation).toBe('preparing'),
  );
  probe.listeners.add(invalidated);
  await act(async () => probe.open());
  expect(invalidated).toHaveBeenCalledOnce();
  probe.listeners.delete(invalidated);
  expect(probe.auth().preparation).toBe('ready');
  await act(async () => probe.auth().refresh());
  expect(probe.realtime.reconnect).toHaveBeenCalledOnce();
  await act(async () => probe.open());
  expect(probe.auth().preparation).toBe('ready');
});

it('fails closed on timeout, ignores a late open, and retries with a fresh handshake', async () => {
  vi.useFakeTimers();
  const probe = await setup();
  await act(async () => vi.advanceTimersByTime(10_000));
  expect(probe.auth().preparation).toBe('failed');
  await act(async () => probe.open());
  expect(probe.auth().preparation).toBe('failed');
  act(() => probe.auth().retryPreparation());
  expect(probe.auth().preparation).toBe('preparing');
  expect(probe.realtime.reconnect).toHaveBeenCalledTimes(2);
  await act(async () => probe.open());
  expect(probe.auth().preparation).toBe('ready');
  expect(probe.listeners.size).toBe(0);
});

it('cancels stale attempts on logout and isolates the same user in a new session', async () => {
  const probe = await setup();
  const oldOpen = [...probe.listeners][0]!;
  await probe.change(null);
  expect(probe.listeners.size).toBe(0);
  expect(probe.realtime.reconnect).toHaveBeenCalledTimes(2);
  await probe.change({ user: { id: 'alice' }, session: { id: 'session-2' } });
  await act(async () => oldOpen());
  expect(probe.auth().preparation).toBe('preparing');
  await act(async () => probe.open());
  expect(probe.auth().preparation).toBe('ready');
  await probe.change({ user: { id: 'bob' }, session: { id: 'session-3' } });
  expect(probe.auth().preparation).toBe('preparing');
  probe.unmount();
  expect(probe.listeners.size).toBe(0);
});

it.each([false, 'uncreated', 'absent'] as const)(
  'does not create connections for inactive realtime (%s)',
  async (active) => {
    const probe = await setup(active);
    expect(probe.auth().preparation).toBe('ready');
    expect(probe.realtime.reconnect).not.toHaveBeenCalled();
    expect(probe.listeners.size).toBe(0);
    expect(probe.createRealtime).not.toHaveBeenCalled();
  },
);

it('cancels a previous session timer before preparing the next session', async () => {
  vi.useFakeTimers();
  const probe = await setup();
  await act(async () => vi.advanceTimersByTime(5_000));
  await probe.change({ user: { id: 'bob' }, session: { id: 'session-2' } });
  await act(async () => vi.advanceTimersByTime(5_000));
  expect(probe.auth().preparation).toBe('preparing');
  await probe.open();
  await act(async () => {});
  expect(probe.auth().preparation).toBe('ready');
  await act(async () => vi.advanceTimersByTime(10_000));
  expect(probe.auth().preparation).toBe('ready');
});

it('ignores a session response superseded by a newer refresh', async () => {
  const probe = await setup(false);
  const old = Promise.withResolvers<{ data: unknown }>();
  probe.getSession.mockReturnValueOnce(old.promise);
  let previous!: Promise<void>;
  act(() => {
    previous = probe.auth().refresh();
  });
  await probe.change({ user: { id: 'bob' }, session: { id: 'session-2' } });
  await act(async () => {
    old.resolve({
      data: { user: { id: 'alice' }, session: { id: 'session-1' } },
    });
    await previous;
  });
  expect(probe.auth().session?.user.id).toBe('bob');
});
