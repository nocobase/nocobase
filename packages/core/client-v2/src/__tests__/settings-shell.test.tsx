/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsShell } from '../settings-app/SettingsShell';
import type { ThemeConfig } from '../theme';

const userCenterModel = { uid: 'settings-user-center' };
const createModel = vi.fn(() => userCenterModel);
const matchRoutes = vi.fn(() => [{ route: { id: 'settings' } }]);

vi.mock('../hooks/useApp', () => ({
  useApp: () => ({
    flowEngine: {
      createModel,
      getModel: vi.fn(() => null),
      getModelClass: vi.fn(() => true),
    },
    router: {
      matchRoutes,
    },
  }),
}));

vi.mock('../flow/admin-shell/admin-layout/NocoBaseLogo', () => ({
  NocoBaseLogo: () => <div data-testid="settings-logo">logo</div>,
}));

vi.mock('../flow/admin-shell/admin-layout/HelpLite', () => ({
  HelpLite: () => <div data-testid="settings-help">help</div>,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    FlowModelRenderer: ({ model }: { model: { uid: string } }) => (
      <div data-testid="settings-user-center">{model.uid}</div>
    ),
  };
});

describe('SettingsShell', () => {
  beforeEach(() => {
    createModel.mockClear();
    matchRoutes.mockReset();
    matchRoutes.mockReturnValue([{ route: { id: 'settings' } }]);
  });

  it('renders only the settings logo, help and user center around its content', () => {
    render(
      <MemoryRouter initialEntries={['/settings/system-settings']}>
        <SettingsShell>
          <div>settings content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('settings-logo')).toBeInTheDocument();
    expect(screen.getByTestId('settings-help')).toBeInTheDocument();
    expect(screen.getByTestId('settings-user-center')).toHaveTextContent('settings-user-center');
    expect(screen.getByText('settings content')).toBeInTheDocument();
    expect(screen.queryByTestId('plugin-settings-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notifications-button')).not.toBeInTheDocument();
  });

  it('keeps the designated header color when the shared header token uses its dark fallback', () => {
    render(
      <ConfigProvider
        theme={
          {
            token: {
              colorBgHeader: '#001529',
              colorPrimary: '#1777FF',
            },
          } as ThemeConfig
        }
      >
        <MemoryRouter initialEntries={['/settings/system-settings']}>
          <SettingsShell>
            <div>settings content</div>
          </SettingsShell>
        </MemoryRouter>
      </ConfigProvider>,
    );

    expect(screen.getByRole('banner')).toHaveStyle({ background: '#176CE1' });
  });

  it.each(['auth.signin', '2fa.verify'])('does not render the settings shell for %s', (routeId) => {
    matchRoutes.mockReturnValue([{ route: { id: routeId } }]);

    render(
      <MemoryRouter initialEntries={[routeId === 'auth.signin' ? '/settings/signin' : '/settings/2fa']}>
        <SettingsShell>
          <div>authentication content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByText('authentication content')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-logo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-help')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-user-center')).not.toBeInTheDocument();
    expect(document.querySelector('#nocobase-embed-container')).not.toBeInTheDocument();
  });
});
