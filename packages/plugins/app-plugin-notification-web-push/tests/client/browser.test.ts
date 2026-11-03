import { afterEach, expect, it, vi } from 'vitest';
import {
  deviceKey,
  pushBase,
  registerWorker,
  currentDevice,
  rememberDevice,
  unsubscribeDevice,
} from '../../client/browser.js';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('uses one trailing-slash scope for router roots, device identity and worker registration', async () => {
  const register = vi.fn(async () => ({}));
  vi.stubGlobal('navigator', { serviceWorker: { register } });
  expect(pushBase('/')).toBe('/');
  expect(pushBase('/nested/app')).toBe('/nested/app/');
  expect(deviceKey('/nested/app', 'alice')).toBe(
    deviceKey('/nested/app/', 'alice'),
  );
  await registerWorker('/nested/app');
  expect(register).toHaveBeenCalledExactlyOnceWith(
    '/nested/app/push-worker.js',
    { scope: '/nested/app/', updateViaCache: 'none' },
  );
});

it('uses the default device identity and logout protocol', async () => {
  const base = '/nested/app/';
  expect(currentDevice(base, 'alice')).toBeNull();
  rememberDevice(base, 'alice', 'persisted-server-device');
  const unsubscribe = vi.fn(async () => true);
  const postMessage = vi.fn();
  const close = vi.fn();
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: async () => ({
        pushManager: { getSubscription: async () => ({ unsubscribe }) },
        active: { postMessage },
        getNotifications: async () => [{ close }],
      }),
    },
  });
  const request = vi.fn(async () => ({})) as never;
  await unsubscribeDevice({ request }, base, 'alice');
  expect(request).toHaveBeenCalledExactlyOnceWith({
    method: 'DELETE',
    path: 'webPush/subscriptions/persisted-server-device',
  });
  expect(unsubscribe).toHaveBeenCalledOnce();
  expect(postMessage).toHaveBeenCalledWith({ kind: 'webPush.logout' });
  expect(close).toHaveBeenCalledOnce();
  expect(currentDevice(base, 'alice')).toBeNull();
});
