import { createECDH, randomUUID } from 'node:crypto';

import webPush, {
  currentDevice,
  rememberDevice,
} from '@nocobase/app-plugin-notification-web-push/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserMenu } from '../../client/layouts/components/user-menu.tsx';
import { AppThemeProvider } from '../../client/theme/index.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

// Push is ready with a valid P-256 private key, as an administrator sets WEB_PUSH_PRIVATE_KEY, and the secrets key that
// encrypts stored subscriptions.
const configured = {
  secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
  push: {
    privateKey: (() => {
      const ecdh = createECDH('prime256v1');
      ecdh.generateKeys();
      return ecdh.getPrivateKey('hex');
    })(),
  },
};

/** The browser APIs push needs, with spies for the two calls that must wait for the person. */
function stubBrowser({ push = true }: { push?: boolean } = {}) {
  const requestPermission = vi.fn(
    async (): Promise<NotificationPermission> => 'denied',
  );
  const register = vi.fn();
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal(
    'Notification',
    Object.assign(function Notification() {}, {
      permission: 'default',
      requestPermission,
    }),
  );
  if (push) vi.stubGlobal('PushManager', function PushManager() {});
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register, getRegistration: vi.fn(async () => undefined) },
  });
  return { requestPermission, register };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
});
afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker');
  localStorage.clear();
});

function renderMenu(
  options: Parameters<typeof renderAuthenticatedClient>[1] = {},
) {
  return renderAuthenticatedClient(
    <AppThemeProvider>
      <UserMenu />
    </AppThemeProvider>,
    { plugins: [webPush()], ...options },
  );
}

async function openAccountMenu(): Promise<void> {
  act(() => screen.getByRole('button', { name: 'Open account menu' }).focus());
  await userEvent.keyboard('{Enter}');
}

async function openPushSettings(): Promise<HTMLElement> {
  await openAccountMenu();
  fireEvent.click(
    await screen.findByRole('menuitem', { name: 'Push notifications' }),
  );
  return screen.findByRole('dialog', { name: 'Push notifications' });
}

describe('push notifications in the account menu', () => {
  it('says push is not configured and asks for nothing when no key is set', async () => {
    const browser = stubBrowser();
    await renderMenu();

    const dialog = await openPushSettings();

    expect(
      await screen.findByText(/Push is not configured/u),
    ).toBeInTheDocument();
    expect(
      dialog.querySelector('button[disabled]')?.textContent ?? '',
    ).toContain('Subscribe this device');
    // Signing in and opening the settings never ask for permission or register a worker.
    expect(browser.requestPermission).not.toHaveBeenCalled();
    expect(browser.register).not.toHaveBeenCalled();
  });

  it('asks for permission only from the subscribe click and explains a refusal', async () => {
    const browser = stubBrowser();
    await renderMenu({ serverConfig: configured });
    await openPushSettings();
    const subscribe = await screen.findByRole('button', {
      name: 'Subscribe this device',
    });
    await waitFor(() => expect(subscribe).toBeEnabled());
    expect(browser.requestPermission).not.toHaveBeenCalled();

    fireEvent.click(subscribe);

    expect(
      await screen.findByText(/Notifications are blocked/u),
    ).toBeInTheDocument();
    expect(browser.requestPermission).toHaveBeenCalledOnce();
    expect(browser.register).not.toHaveBeenCalled();
  });

  it('explains when the browser cannot receive push', async () => {
    const browser = stubBrowser({ push: false });
    await renderMenu({ serverConfig: configured });
    await openPushSettings();

    expect(
      await screen.findByText(/Push needs HTTPS and a browser/u),
    ).toBeInTheDocument();
    expect(browser.requestPermission).not.toHaveBeenCalled();
  });
});

describe('signing out with push', () => {
  it('removes this browser’s device before ending the session, even when it was already removed', async () => {
    stubBrowser();
    const deletes: string[] = [];
    const view = await renderMenu({
      serverConfig: configured,
      afterResponse(request, response) {
        if (request.method === 'DELETE')
          deletes.push(`${new URL(request.url).pathname} ${response.status}`);
      },
    });
    const base = view.server.publicBasePath;
    const removed = randomUUID();
    rememberDevice(base, view.session.user.id, removed);

    await openAccountMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(view.identity().session).toBeNull());
    expect(deletes).toEqual([
      `${base.replace(/\/$/u, '')}/api/webPush/subscriptions/${removed} 404`,
    ]);
    expect(currentDevice(base, view.session.user.id)).toBeNull();
  });

  it('keeps the session when this browser’s device cannot be removed', async () => {
    stubBrowser();
    const view = await renderMenu({
      serverConfig: configured,
      beforeRequest(request) {
        if (request.method === 'DELETE') throw new TypeError('Failed to fetch');
      },
    });
    rememberDevice(
      view.server.publicBasePath,
      view.session.user.id,
      randomUUID(),
    );

    await openAccountMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(view.toasts()).toHaveLength(1));
    expect(view.identity().session?.user.id).toBe(view.session.user.id);
    expect(
      await (await view.session.fetch('/auth/get-session')).json(),
    ).toMatchObject({ user: { id: view.session.user.id } });
  });
});
