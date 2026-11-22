import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import enUS from '../client/locales/en-US.js';
import { NotificationPreferencesPage } from '../client/preferences/notification-preferences-page.js';
import { createNotificationRoutes } from '../client/routes.js';
import { DeliveriesTab } from '../client/settings/deliveries-tab.js';
import { NotificationSettingsPage } from '../client/settings/notification-settings-page.js';
import type { NotificationPreferencesView } from '../shared/preferences.js';

const NS = '@nocobase/app-plugin-notification';

interface Call {
  readonly method: string;
  readonly path: string;
  readonly json?: unknown;
}

function render(
  element: ReactElement,
  answer: (call: Call) => unknown,
  calls: Call[],
) {
  return renderWithApp(element, {
    namespace: NS,
    namespaces: { [NS]: { 'en-US': () => Promise.resolve(enUS) } },
    fetch: answerApi(({ method, path, json }) => {
      calls.push({ method, path, ...(json === undefined ? {} : { json }) });
      return answer({ method, path, json });
    }),
    services: (app) => {
      app.container.instance(
        authorizationClientToken,
        new AuthorizationClient(app.container.resolve(apiClientToken)),
      );
    },
  });
}

const preferences = (emailEnabled: boolean): NotificationPreferencesView => ({
  channelTypes: ['email', 'in-app'],
  kinds: [
    {
      id: 'approval.requested',
      contributor: '@example/approvals',
      name: 'Approval requested',
      category: 'Approvals',
      categoryKey: 'approvals',
      channels: [
        { type: 'in-app', policy: 'required', adjustable: false, enabled: true },
        { type: 'email', policy: 'on', adjustable: true, enabled: emailEnabled },
      ],
    },
  ],
});

describe('personal notification preferences', () => {
  it('locks a required channel and saves a changed one', async () => {
    const calls: Call[] = [];
    await render(
      <NotificationPreferencesPage />,
      ({ method, path }) =>
        path === 'notifications/preferences'
          ? { data: preferences(method !== 'PUT') }
          : new Response(null, { status: 404 }),
      calls,
    );
    const inApp = await screen.findByRole('switch', {
      name: 'Approval requested · In-app messages',
    });
    expect(inApp).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('columnheader', { name: 'In-app messages' }),
    ).toBeVisible();
    expect(screen.getByRole('rowheader', { name: 'Approvals' })).toBeVisible();
    expect(screen.getByText(/account email address/u)).toBeVisible();

    const email = screen.getByRole('switch', {
      name: 'Approval requested · Email',
    });
    expect(email).toBeChecked();
    fireEvent.click(email);
    await waitFor(() => expect(email).not.toBeChecked());
    expect(calls.filter((call) => call.method === 'PUT')).toEqual([
      {
        method: 'PUT',
        path: 'notifications/preferences',
        json: {
          items: [
            { kind: 'approval.requested', channelType: 'email', enabled: false },
          ],
        },
      },
    ]);
  });
});

const failed = {
  delivery: {
    id: 'd1',
    notificationId: 'n1',
    channelName: 'mail',
    channelType: 'email',
    providerType: 'smtp',
    recipientKey: 'alice@example.com',
    attemptCount: 3,
    status: 'failed',
    lastError: { message: 'Mailbox unavailable' },
    createdAt: '2026-11-20T08:00:00.000Z',
    updatedAt: '2026-11-20T08:05:00.000Z',
  },
  kind: 'approval.requested',
  sourceType: '@example/approvals',
};

function renderDeliveries(actions: readonly string[], calls: Call[]) {
  return render(
    <DeliveriesTab
      filter={{}}
      onFilterChange={() => {}}
      selectedId='d1'
      onSelect={() => {}}
    />,
    ({ method, path }) => {
      if (path === 'authorization/permissions')
        return {
          data: {
            unrestricted: false,
            permissions: [
              { resource: { type: 'settings', id: 'notification' }, actions },
            ],
          },
        };
      if (path === 'notifications/channels')
        return {
          data: [],
          meta: {
            total: 0,
            delivery: {
              retry: { maxAttempts: 3, intervalMs: 1000, configured: false },
            },
          },
        };
      if (path === 'notifications/kinds') return { data: [] };
      if (path === 'notifications/deliveries')
        return { data: [failed], meta: { statusCounts: { failed: 1 } } };
      if (path === 'notifications/deliveries/d1')
        return { data: { ...failed, attempts: [], retryAudits: [] } };
      if (path === 'notifications/deliveries/d1/retry' && method === 'POST')
        return { data: { ...failed.delivery, status: 'pending' } };
      return new Response(null, { status: 404 });
    },
    calls,
  );
}

describe('delivery retry', () => {
  it('needs a reason before retrying a failed delivery', async () => {
    const calls: Call[] = [];
    await renderDeliveries(['read', 'manage'], calls);
    const drawer = await screen.findByRole('dialog');
    fireEvent.click(
      await within(drawer).findByRole('button', { name: 'Retry' }),
    );
    const dialog = await screen.findByRole('alertdialog').catch(() =>
      screen.findByRole('dialog', { name: 'Retry delivery' }),
    );
    const confirm = within(dialog).getByRole('button', { name: 'Retry' });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Reason' }), {
      target: { value: '   ' },
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Reason' }), {
      target: { value: 'Mailbox fixed' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(calls).toContainEqual({
        method: 'POST',
        path: 'notifications/deliveries/d1/retry',
        json: { reason: 'Mailbox fixed' },
      }),
    );
  });

  it('offers no retry to a viewer without manage', async () => {
    const calls: Call[] = [];
    await renderDeliveries(['read'], calls);
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText('Mailbox unavailable')).toBeVisible();
    await waitFor(() =>
      expect(
        calls.some((call) => call.path === 'authorization/permissions'),
      ).toBe(true),
    );
    expect(within(drawer).queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

describe('notification routes', () => {
  it('registers the settings page behind the notification read grant and the personal page for every account', () => {
    const [settings, personal] = createNotificationRoutes();
    expect(settings).toMatchObject({
      parent: 'systemSettings',
      routes: [
        {
          parent: 'messages',
          name: 'notificationSettings',
          path: '/notifications',
          authz: {
            resource: { type: 'settings', id: 'notification' },
            action: 'read',
          },
        },
      ],
    });
    expect(personal).toMatchObject({
      parent: 'personalSettings',
      routes: [
        { parent: 'messages', name: 'notificationPreferences', path: '/notifications' },
      ],
    });
    expect(
      createNotificationRoutes({ settingsPage: false, preferencesPage: false }),
    ).toEqual([]);
  });
});

describe('notification settings page', () => {
  it('lists the channels and hides the test send from a viewer', async () => {
    const calls: Call[] = [];
    await render(
      <NotificationSettingsPage />,
      ({ path }) => {
        if (path === 'authorization/permissions')
          return {
            data: {
              unrestricted: false,
              permissions: [
                {
                  resource: { type: 'settings', id: 'notification' },
                  actions: ['read'],
                },
              ],
            },
          };
        if (path === 'notifications/channels')
          return {
            data: [
              {
                name: 'mail',
                type: 'smtp',
                channelType: 'email',
                enabled: true,
                summary: [{ label: 'Host', value: 'smtp.example.com' }],
                testable: true,
                reachesUsers: true,
                last24h: { accepted: 4, failed: 0, pending: 0, unknown: 0 },
              },
            ],
            meta: {
              total: 1,
              delivery: {
                retry: { maxAttempts: 3, intervalMs: 60000, configured: true },
              },
            },
          };
        return new Response(null, { status: 404 });
      },
      calls,
    );
    expect(await screen.findByText('smtp.example.com')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Channels' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() =>
      expect(
        calls.some((call) => call.path === 'authorization/permissions'),
      ).toBe(true),
    );
    expect(screen.queryByRole('button', { name: 'Test' })).toBeNull();
  });
});
