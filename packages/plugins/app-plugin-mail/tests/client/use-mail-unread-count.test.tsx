import {
  apiClientToken,
  ClientApplication,
  ClientApplicationContext,
  createApiClient,
  createAppClientConfig,
  defineClientPlugins,
  realtimeClientToken,
  type RealtimeClient,
  type RealtimeErrorEvent,
  type RealtimeListener,
} from '@nocobase/app-client';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import {
  MailClient,
  mailClientToken,
  useMailUnreadCount,
  type MailUnreadCountState,
} from '@nocobase/app-plugin-mail/client';
import { MailNavigationIcon } from '@nocobase/app-plugin-mail/client/components';
import { MAIL_REALTIME_TOPIC } from '@nocobase/app-plugin-mail/realtime';
import { I18nProvider } from '@nocobase/i18n/client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { act, cleanup, render, screen } from '@testing-library/react';
import { StrictMode, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import mailLocales from '../../client/locales/index.js';
import { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../../client/subscription.js';

/** Only the transport is fake: the hook uses the production subscription. */
class TestRealtime implements RealtimeClient {
  public connected = false;
  public readonly topics = new Map<string, Set<RealtimeListener<unknown>>>();
  public readonly opens = new Set<() => void>();
  public readonly errors = new Set<(event: RealtimeErrorEvent) => void>();

  public subscribe<Payload>(
    topic: string,
    listener: RealtimeListener<Payload>,
  ): () => void {
    const listeners =
      this.topics.get(topic) ?? new Set<RealtimeListener<unknown>>();
    // The public API allows a typed listener; emit supplies that subscription's payload.
    const untyped = listener as RealtimeListener<unknown>;
    listeners.add(untyped);
    this.topics.set(topic, listeners);
    return () => {
      listeners.delete(untyped);
      if (!listeners.size) this.topics.delete(topic);
    };
  }

  public onOpen(listener: () => void): () => void {
    this.opens.add(listener);
    return () => {
      this.opens.delete(listener);
    };
  }

  public onError(listener: (event: RealtimeErrorEvent) => void): () => void {
    this.errors.add(listener);
    return () => {
      this.errors.delete(listener);
    };
  }

  public reconnect(): void {
    this.connected = true;
    this.opens.forEach((listener) => listener());
  }

  public close(): void {
    this.connected = false;
  }

  public emit(payload: unknown, topic: string = MAIL_REALTIME_TOPIC): void {
    this.topics.get(topic)?.forEach((listener) =>
      listener({
        type: 'event',
        topic,
        payload,
        publishedAt: new Date().toISOString(),
      }),
    );
  }
}

class TestHttp {
  public readonly requests: Request[] = [];
  public readonly responses: ReturnType<
    typeof Promise.withResolvers<Response>
  >[] = [];
  public readonly fetch: typeof globalThis.fetch = (input, init) => {
    const request = new Request(input, init);
    expect(request.method).toBe('GET');
    expect(new URL(request.url).pathname).toBe(
      '/api/mail/messages/countUnread',
    );
    this.requests.push(request);
    const response = Promise.withResolvers<Response>();
    this.responses.push(response);
    return response.promise;
  };

  public async count(index: number, count: number): Promise<void> {
    await act(async () => {
      await Promise.resolve();
      this.responses[index]!.resolve(Response.json({ data: count }));
    });
  }

  public async fail(index: number): Promise<void> {
    await act(async () => {
      await Promise.resolve();
      this.responses[index]!.resolve(
        Response.json(
          {
            error: {
              code: 'UNAVAILABLE',
              status: 503,
              reason: 'MAIL_UNAVAILABLE',
              domain: 'mail',
              message: 'Mail unavailable',
              requestId: 'test',
            },
          },
          { status: 503 },
        ),
      );
    });
  }
}

interface Fixture {
  readonly app: ClientApplication;
  readonly http: TestHttp;
  readonly realtime: TestRealtime;
  readonly mail: MailClient;
  provider(children: ReactNode): ReactElement;
}

async function fixture(): Promise<Fixture> {
  const http = new TestHttp();
  const realtime = new TestRealtime();
  const i18n = await createTestI18nRuntime({
    namespaces: {
      '@nocobase/app-plugin-mail': mailLocales,
    },
  });
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@test/mail-unread',
      plugins: defineClientPlugins([]),
      createAppConfig: createAppClientConfig,
    }),
    { rawConfig: {}, rawPublicConfig: {}, i18n },
  );
  const app = new ClientApplication({
    runtime,
    createRenderConfig: () => ({ routes: null }),
  });
  // An isolated application context with real service resolution. Do not start
  // core providers: they own a browser WebSocket, replaced here by TestRealtime.
  const api = createApiClient({
    baseURL: 'http://localhost/api',
    fetch: http.fetch,
  });
  const mail = new MailClient(api);
  app.container.instance(apiClientToken, api);
  app.container.instance(realtimeClientToken, realtime);
  app.container.instance(mailClientToken, mail);
  return {
    app,
    http,
    realtime,
    mail,
    provider: (children) => (
      <ClientApplicationContext.Provider value={app}>
        <I18nProvider runtime={i18n}>{children}</I18nProvider>
      </ClientApplicationContext.Provider>
    ),
  };
}

function Probe({
  id = 'state',
  record,
}: {
  readonly id?: string;
  readonly record?: (state: MailUnreadCountState) => void;
}): ReactElement {
  const state: MailUnreadCountState = useMailUnreadCount();
  record?.(state);
  return (
    <output data-testid={id}>
      {JSON.stringify({
        count: state.unreadCount ?? 'unknown',
        loading: state.loading,
        error: state.error instanceof Error ? state.error.message : null,
      })}
    </output>
  );
}

function expectState(
  count: number | 'unknown',
  loading: boolean,
  error: string | null = null,
  id = 'state',
): void {
  expect(JSON.parse(screen.getByTestId(id).textContent ?? '')).toEqual({
    count,
    loading,
    error,
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function invalidate(times = 1): void {
  act(() => {
    for (let i = 0; i < times; i++)
      window.dispatchEvent(new Event(MAIL_UNREAD_COUNT_CHANGED_EVENT));
  });
}

function focus(): void {
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
}

describe('useMailUnreadCount public hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('distinguishes unknown loading from a real zero and recovers from initial failure', async () => {
    const f = await fixture();
    render(f.provider(<Probe />));
    expectState('unknown', true);
    await f.http.fail(0);
    expectState('unknown', false, 'Mail unavailable');
    invalidate();
    await advance(100);
    expectState('unknown', true, 'Mail unavailable');
    await f.http.count(1, 0);
    expectState(0, false);
  });

  it('retains the count during background refresh and failure, clearing error on recovery', async () => {
    const f = await fixture();
    render(f.provider(<Probe />));
    await f.http.count(0, 8);
    invalidate();
    expectState(8, false);
    await advance(99);
    expectState(8, false);
    await advance(1);
    expectState(8, true);
    await f.http.fail(1);
    expectState(8, false, 'Mail unavailable');
    invalidate();
    await advance(100);
    expectState(8, true, 'Mail unavailable');
    await f.http.count(2, 3);
    expectState(3, false);
  });

  it('uses actual topic subscriptions, ignores invalid events, and refreshes on reconnect', async () => {
    const f = await fixture();
    render(f.provider(<Probe />));
    await f.http.count(0, 1);
    expect([...f.realtime.topics.keys()]).toEqual([MAIL_REALTIME_TOPIC]);
    act(() => {
      for (const payload of [
        null,
        undefined,
        'mail.changed',
        {},
        { kind: 'other' },
      ])
        f.realtime.emit(payload);
      f.realtime.emit({ kind: 'mail.changed' }, 'other:topic');
    });
    await advance(100);
    expect(f.http.requests).toHaveLength(1);
    act(() => {
      f.realtime.emit({ kind: 'mail.changed' });
    });
    await advance(100);
    await f.http.count(1, 2);
    expectState(2, false);
    act(() => {
      f.realtime.reconnect();
    });
    await advance(100);
    await f.http.count(2, 4);
    expectState(4, false);
  });

  it('debounces mixed invalidations for 100ms after the last event', async () => {
    const f = await fixture();
    render(f.provider(<Probe />));
    await f.http.count(0, 1);
    invalidate(10);
    await advance(99);
    expect(f.http.requests).toHaveLength(1);
    act(() => {
      f.realtime.emit({ kind: 'mail.changed' });
    });
    await advance(99);
    expect(f.http.requests).toHaveLength(1);
    await advance(1);
    expect(f.http.requests).toHaveLength(2);
    await f.http.count(1, 2);
  });

  it('throttles focus recovery at 30 seconds, independently of the 60-second poll', async () => {
    const f = await fixture();
    render(f.provider(<Probe />));
    await f.http.count(0, 1);
    focus();
    await advance(29_999);
    focus();
    expect(f.http.requests).toHaveLength(1);
    await advance(1);
    focus();
    await advance(100);
    expect(f.http.requests).toHaveLength(2);
    await f.http.count(1, 2);
    focus();
    await advance(29_900);
    expect(f.http.requests).toHaveLength(2);
    await advance(99);
    expect(f.http.requests).toHaveLength(2);
    await advance(1);
    expect(f.http.requests).toHaveLength(3);
    await f.http.count(2, 3);
    await advance(60_000);
    expect(f.http.requests).toHaveLength(4);
    await f.http.count(3, 4);
  });

  it.each(['success', 'failure'] as const)(
    'serializes a slow request, discards stale %s, and runs only one trailing refresh',
    async (outcome) => {
      const f = await fixture();
      const states: MailUnreadCountState[] = [];
      render(
        f.provider(
          <Probe
            record={(state) => {
              states.push(state);
            }}
          />,
        ),
      );
      await f.http.count(0, 7);
      invalidate();
      await advance(100);
      expectState(7, true);
      invalidate(20);
      act(() => {
        f.realtime.emit({ kind: 'mail.changed' });
        f.realtime.reconnect();
      });
      await advance(500);
      invalidate(20);
      await advance(500);
      expect(f.http.requests).toHaveLength(2);
      if (outcome === 'success') await f.http.count(1, 99);
      else await f.http.fail(1);
      expectState(7, true);
      await advance(99);
      expect(f.http.requests).toHaveLength(2);
      await advance(1);
      expect(f.http.requests).toHaveLength(3);
      await f.http.count(2, 0);
      expectState(0, false);
      expect(
        states.some(
          (state) => state.unreadCount === 99 || state.error !== undefined,
        ),
      ).toBe(false);
      await advance(500);
      expect(f.http.requests).toHaveLength(3);
    },
  );

  it.each(['success', 'failure'] as const)(
    'cleans up listeners/timers and ignores late %s after unmount',
    async (outcome) => {
      const add = vi.spyOn(window, 'addEventListener');
      const remove = vi.spyOn(window, 'removeEventListener');
      const f = await fixture();
      const states: MailUnreadCountState[] = [];
      const baseline = vi.getTimerCount();
      const view = render(
        f.provider(
          <Probe
            record={(state) => {
              states.push(state);
            }}
          />,
        ),
      );
      invalidate();
      const listeners = add.mock.calls.filter(
        ([type]) =>
          type === 'focus' || type === MAIL_UNREAD_COUNT_CHANGED_EVENT,
      );
      expect(listeners).toHaveLength(2);
      view.unmount();
      const renders = states.length;
      expect(f.realtime.topics.size).toBe(0);
      expect(f.realtime.opens.size).toBe(0);
      for (const [type, listener] of listeners)
        expect(remove).toHaveBeenCalledWith(type, listener);
      expect(vi.getTimerCount()).toBe(baseline);
      invalidate();
      focus();
      act(() => {
        f.realtime.emit({ kind: 'mail.changed' });
        f.realtime.reconnect();
      });
      if (outcome === 'success') await f.http.count(0, 42);
      else await f.http.fail(0);
      await advance(120_000);
      expect(f.http.requests).toHaveLength(1);
      expect(states).toHaveLength(renders);
    },
  );

  it('remounts for a session key with the same MailClient without showing the old user count', async () => {
    const f = await fixture();
    const states: MailUnreadCountState[] = [];
    const probe = (key: string) =>
      f.provider(
        <Probe
          key={key}
          record={(state) => {
            states.push(state);
          }}
        />,
      );
    const view = render(probe('alice'));
    await f.http.count(0, 12);
    invalidate();
    await advance(100);
    const beforeSwitch = states.length;
    view.rerender(probe('bob'));
    expect(f.app.services.resolve(mailClientToken)).toBe(f.mail);
    expectState('unknown', true);
    await f.http.count(2, 2);
    await f.http.count(1, 88);
    expectState(2, false);
    expect(
      states
        .slice(beforeSwitch)
        .every(
          (state) => state.unreadCount === undefined || state.unreadCount === 2,
        ),
    ).toBe(true);
    expect(f.realtime.opens.size).toBe(1);
  });

  it.each(['success', 'failure'] as const)(
    'protects even the first render when the host services change, including new request %s',
    async (outcome) => {
      const first = await fixture();
      const second = await fixture();
      const states: MailUnreadCountState[] = [];
      const probe = (
        <Probe
          record={(state) => {
            states.push(state);
          }}
        />
      );
      const view = render(first.provider(probe));
      await first.http.count(0, 9);
      invalidate();
      await advance(100);
      const beforeSwitch = states.length;
      view.rerender(second.provider(probe));
      expectState('unknown', true);
      expect(states[beforeSwitch]?.unreadCount).toBeUndefined();
      await first.http.count(1, 50);
      expectState('unknown', true);
      if (outcome === 'success') {
        await second.http.count(0, 3);
        expectState(3, false);
      } else {
        await second.http.fail(0);
        expectState('unknown', false, 'Mail unavailable');
        invalidate();
        await advance(100);
        await second.http.count(1, 3);
        expectState(3, false);
      }
      expect(first.realtime.topics.size).toBe(0);
      expect(second.realtime.opens.size).toBe(1);
    },
  );

  it.each(['success', 'failure'] as const)(
    'resets stored results on an A to B to A host roundtrip before new A request %s',
    async (outcome) => {
      const first = await fixture();
      const second = await fixture();
      const states: MailUnreadCountState[] = [];
      const probe = (
        <Probe
          record={(state) => {
            states.push(state);
          }}
        />
      );
      const view = render(first.provider(probe));
      await first.http.count(0, 9);
      expectState(9, false);
      view.rerender(second.provider(probe));
      await advance(0);
      expectState('unknown', true);
      expect(second.http.requests).toHaveLength(1);
      const beforeReturn = states.length;
      view.rerender(first.provider(probe));
      await advance(0);
      expectState('unknown', true);
      expect(first.http.requests).toHaveLength(2);
      expect(
        states
          .slice(beforeReturn)
          .every((state) => state.unreadCount === undefined && state.loading),
      ).toBe(true);
      await second.http.count(0, 88);
      expectState('unknown', true);
      if (outcome === 'success') {
        await first.http.count(1, 3);
        expectState(3, false);
      } else {
        await first.http.fail(1);
        expectState('unknown', false, 'Mail unavailable');
      }
      expect(second.realtime.topics.size).toBe(0);
      expect(first.realtime.opens.size).toBe(1);
    },
  );

  it('keeps refresh coordination instance-local even for the same MailClient', async () => {
    const f = await fixture();
    render(
      f.provider(
        <>
          <Probe id='one' />
          <Probe id='two' />
        </>,
      ),
    );
    await advance(0);
    expect(f.http.requests).toHaveLength(2);
    await f.http.count(0, 1);
    await f.http.count(1, 2);
    expectState(1, false, null, 'one');
    expectState(2, false, null, 'two');
    invalidate();
    await advance(100);
    expect(f.http.requests).toHaveLength(4);
    await f.http.count(3, 4);
    invalidate();
    await advance(100);
    expect(f.http.requests).toHaveLength(5);
    await f.http.count(2, 99);
    expectState(1, true, null, 'one');
    await advance(100);
    expect(f.http.requests).toHaveLength(6);
    await f.http.count(4, 5);
    await f.http.count(5, 6);
    expectState(6, false, null, 'one');
    expectState(5, false, null, 'two');
  });

  it('survives StrictMode effect replay without duplicate active subscriptions or stale results', async () => {
    const f = await fixture();
    const view = render(<StrictMode>{f.provider(<Probe />)}</StrictMode>);
    await advance(0);
    expect(f.http.requests).toHaveLength(2);
    expect(f.realtime.opens.size).toBe(1);
    expect(f.realtime.topics.get(MAIL_REALTIME_TOPIC)?.size).toBe(1);
    await f.http.count(1, 2);
    await f.http.count(0, 99);
    expectState(2, false);
    invalidate();
    await advance(100);
    expect(f.http.requests).toHaveLength(3);
    await f.http.count(2, 3);
    expectState(3, false);
    view.unmount();
    expect(f.realtime.opens.size).toBe(0);
    expect(f.realtime.topics.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders the real icon with a 99+ badge, translated full count, and no zero badge', async () => {
    const f = await fixture();
    render(f.provider(<MailNavigationIcon />));
    expect(screen.queryByText('99+')).toBeNull();
    await f.http.count(0, 123);
    expect(screen.getByLabelText('123 unread messages').textContent).toBe(
      '99+',
    );
    invalidate();
    await advance(100);
    await f.http.count(1, 0);
    expect(screen.queryByLabelText('123 unread messages')).toBeNull();
    expect(screen.queryByLabelText('0 unread messages')).toBeNull();
  });
});
