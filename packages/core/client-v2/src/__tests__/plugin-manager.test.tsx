/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLRolesCheckProvider, createMockClient, Plugin } from '@nocobase/client-v2';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { NocoBaseBuildInPlugin } from '../nocobase-buildin-plugin';

class TestAclPlugin extends Plugin {
  async load() {
    this.app.use(ACLRolesCheckProvider);
  }
}

type MockClientApplication = ReturnType<typeof createMockClient>;

const renderApp = (app: MockClientApplication) => {
  const Root = app.getRootComponent();
  render(<Root />);
};

const waitForGetRequests = async (app: MockClientApplication, urls: string[]) => {
  await waitFor(
    () => {
      const history = app.apiMock.history.get.map((request) => request.url);
      expect(history).toEqual(expect.arrayContaining(urls));
    },
    { timeout: 3000 },
  );
};

const setupApp = (pmList: any[]) => {
  const app = createMockClient({
    plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
    router: { type: 'memory', initialEntries: ['/admin/settings/plugin-manager'] },
  });

  app.apiMock.onGet('/auth:check').reply(200, {
    data: { id: 1, nickname: 'Super Admin' },
  });
  app.apiMock.onGet('app:getLang').reply(200, {
    data: { lang: 'en-US', resources: { client: {} }, cron: {} },
  });
  app.apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app' } });
  app.apiMock.onGet('roles:check').reply(200, {
    data: { role: 'root', snippets: ['pm', 'pm.system-settings.system-settings'] },
  });
  app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, { data: [] });
  app.apiMock.onGet('systemSettings:get').reply(200, {
    data: {
      id: 1,
      title: 'NocoBase',
      raw_title: 'NocoBase',
      enabledLanguages: ['en-US'],
      logo: null,
    },
  });
  app.apiMock.onGet('pm:list').reply(200, { data: pmList });
  app.apiMock.onGet('pm:listEnabledV2').reply(200, { data: [] });

  // pm:* mutations default to GET in axios when called via api.request without method
  app.apiMock.onGet('pm:enable').reply(200, { data: {} });
  app.apiMock.onGet('pm:disable').reply(200, { data: {} });
  app.apiMock.onGet('pm:remove').reply(200, { data: {} });

  return app;
};

describe('plugin-manager page', () => {
  it('fires pm:enable when toggling switch on a disabled plugin', async () => {
    const app = setupApp([
      {
        name: 'demo-plugin',
        packageName: '@nocobase/demo-plugin',
        displayName: 'Demo plugin',
        description: 'A demo',
        enabled: false,
        builtIn: false,
        removable: true,
        version: '0.1.0',
        isCompatible: true,
        keywords: [],
      },
    ]);

    renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'pm:list']);

    const card = await screen.findByRole('button', { name: 'Demo plugin' });
    const switchControl = within(card.closest('.ant-card') as HTMLElement).getByRole('switch');
    expect(switchControl).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switchControl);

    await waitFor(() => {
      const enableCall = app.apiMock.history.get.find((req) => req.url === 'pm:enable');
      expect(enableCall).toBeDefined();
      expect(enableCall?.params).toMatchObject({ filterByTk: 'demo-plugin' });
    });
  });

  it('fires pm:disable after confirm when toggling switch on an enabled plugin', async () => {
    const app = setupApp([
      {
        name: 'demo-plugin',
        packageName: '@nocobase/demo-plugin',
        displayName: 'Demo plugin',
        description: 'A demo',
        enabled: true,
        builtIn: false,
        removable: true,
        version: '0.1.0',
        isCompatible: true,
        keywords: [],
      },
    ]);

    renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'pm:list']);

    const card = await screen.findByRole('button', { name: 'Demo plugin' });
    const switchControl = within(card.closest('.ant-card') as HTMLElement).getByRole('switch');
    expect(switchControl).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(switchControl);

    const confirmTitle = await screen.findByText('Are you sure to disable this plugin?');
    const confirmDialog = confirmTitle.closest('.ant-modal-confirm') as HTMLElement;
    expect(confirmDialog).not.toBeNull();
    const okButton = within(confirmDialog).getByText('OK');
    fireEvent.click(okButton);

    await waitFor(() => {
      const disableCall = app.apiMock.history.get.find((req) => req.url === 'pm:disable');
      expect(disableCall).toBeDefined();
      expect(disableCall?.params).toMatchObject({ filterByTk: 'demo-plugin' });
    });
  });

  it('fires pm:remove after Popconfirm on a removable plugin', async () => {
    const app = setupApp([
      {
        name: 'demo-plugin',
        packageName: '@nocobase/demo-plugin',
        displayName: 'Demo plugin',
        description: 'A demo',
        enabled: false,
        builtIn: false,
        removable: true,
        version: '0.1.0',
        isCompatible: true,
        keywords: [],
      },
    ]);

    renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'pm:list']);

    const removeLink = await screen.findByText('Remove');
    fireEvent.click(removeLink);

    const yesButton = await screen.findByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    await waitFor(() => {
      const removeCall = app.apiMock.history.get.find((req) => req.url === 'pm:remove');
      expect(removeCall).toBeDefined();
      expect(removeCall?.params).toMatchObject({ filterByTk: 'demo-plugin' });
    });
  });
});
