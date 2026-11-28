import { workerSource } from '../../server/worker.js';
import vm from 'node:vm';
import { expect, it, vi } from 'vitest';

async function worker() {
  const handlers = new Map<string, (event: unknown) => void>();
  const existing = {
    url: 'https://app.example.test/nested/app/dashboard',
    navigate: vi.fn(async (_url: string): Promise<unknown> => undefined),
    focus: vi.fn(async () => undefined),
    postMessage: vi.fn(),
  };
  const clients = {
    claim: vi.fn(),
    matchAll: vi.fn(async () => [existing]),
    openWindow: vi.fn(),
  };
  const registration = {
    scope: 'https://app.example.test/nested/app/',
    showNotification: vi.fn(async () => undefined),
  };
  const self = {
    registration,
    clients,
    addEventListener: (name: string, handler: (event: unknown) => void) =>
      handlers.set(name, handler),
  };
  const indexedDB = {
    open: () => {
      const request: { onerror?: () => void } = {};
      queueMicrotask(() => request.onerror?.());
      return request;
    },
  };
  vm.runInNewContext(workerSource({ title: 'Application' }), {
    self,
    URL,
    indexedDB,
  });
  const dispatch = async (kind: string, extra: object) => {
    let complete: Promise<void> | undefined;
    handlers.get(kind)!({
      ...extra,
      waitUntil: (value: Promise<void>) => {
        complete = value;
      },
    });
    await complete;
  };
  return { dispatch, existing, clients, registration };
}

it('always displays an incoming push, including with a visible window, as WebKit requires', async () => {
  const f = await worker();
  await f.dispatch('push', {
    data: {
      json: () => ({
        title: 'Review ready',
        dedupeKey: 'session:s1:4',
        url: '/nested/app/tasks/1',
      }),
    },
  });
  expect(f.registration.showNotification).toHaveBeenCalledExactlyOnceWith(
    'Review ready',
    expect.objectContaining({
      tag: 'session:s1:4',
      data: {
        url: 'https://app.example.test/nested/app/tasks/1',
      },
    }),
  );
});

it('focuses and navigates an existing app window and rejects outside-scope click targets', async () => {
  const f = await worker();
  await f.dispatch('notificationclick', {
    notification: {
      close: vi.fn(),
      data: { url: 'https://evil.example/steal' },
    },
  });
  expect(f.existing.navigate).toHaveBeenCalledWith(
    'https://app.example.test/nested/app/',
  );
  expect(f.existing.focus).toHaveBeenCalledOnce();
  expect(f.clients.openWindow).not.toHaveBeenCalled();
  await f.dispatch('notificationclick', {
    notification: {
      close: vi.fn(),
      data: { url: '/nested/app/../outside' },
    },
  });
  expect(f.existing.navigate).toHaveBeenLastCalledWith(
    'https://app.example.test/nested/app/',
  );
});

it('focuses the window before navigating, and hands the target to a window it does not control', async () => {
  const f = await worker();
  const order: string[] = [];
  f.existing.focus.mockImplementation(async () => {
    order.push('focus');
  });
  f.existing.navigate.mockImplementation(async () => {
    order.push('navigate');
    throw new TypeError(
      "This service worker is not the client's active service worker.",
    );
  });
  await f.dispatch('notificationclick', {
    notification: {
      close: vi.fn(),
      data: { url: 'https://app.example.test/nested/app/tasks/1' },
    },
  });
  expect(order).toEqual(['focus', 'navigate']);
  expect(f.existing.postMessage).toHaveBeenCalledExactlyOnceWith({
    kind: 'webPush.navigate',
    url: 'https://app.example.test/nested/app/tasks/1',
  });
  expect(f.clients.openWindow).not.toHaveBeenCalled();
});

it('opens the target when no app window is running', async () => {
  const f = await worker();
  f.clients.matchAll.mockResolvedValue([]);
  await f.dispatch('notificationclick', {
    notification: {
      close: vi.fn(),
      data: { url: '/nested/app/tasks/1' },
    },
  });
  expect(f.clients.openWindow).toHaveBeenCalledExactlyOnceWith(
    'https://app.example.test/nested/app/tasks/1',
  );
});
