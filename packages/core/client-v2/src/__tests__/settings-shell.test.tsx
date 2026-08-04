/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setCurrentUserAuthStatus } from '../nocobase-buildin-plugin/currentUserAuthStatus';
import { SettingsShell } from '../settings-app/SettingsShell';
import type { ThemeConfig } from '../theme';

const userCenterModel = { uid: 'settings-user-center' };
const createModel = vi.fn(() => userCenterModel);
const matchRoutes = vi.fn(() => [{ route: { id: 'settings' } }]);
let settingsThemeConfig: ThemeConfig | null = null;
const mockApp = {
  flowEngine: {
    createModel,
    getModel: vi.fn(() => null),
    getModelClass: vi.fn(() => true),
  },
  router: {
    matchRoutes,
  },
};

vi.mock('../hooks/useApp', () => ({
  useApp: () => mockApp,
}));

vi.mock('../settings-app/SettingsBrand', () => ({
  SettingsBrand: () => <div data-testid="settings-logo">logo</div>,
}));

vi.mock('../settings-app/SettingsGroupNav', () => ({
  SettingsGroupNav: () => <div data-testid="settings-group-nav">groups</div>,
}));

vi.mock('../settings-app/SettingsSearch', () => ({
  SettingsSearch: () => <div data-testid="settings-search">search</div>,
}));

vi.mock('../settings-app/useSettingsThemeConfig', () => ({
  useSettingsThemeConfig: () => settingsThemeConfig,
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

const TokenProbe = () => {
  const { token } = antdTheme.useToken();

  return <div data-testid="settings-theme-token">{`${token.marginBlock}:${token.sizeLG}`}</div>;
};

describe('SettingsShell', () => {
  beforeEach(() => {
    settingsThemeConfig = null;
    createModel.mockClear();
    matchRoutes.mockReset();
    matchRoutes.mockReturnValue([{ route: { id: 'settings' } }]);
    setCurrentUserAuthStatus(mockApp, 'authenticated');
  });

  it('renders only the settings brand, group nav, help and user center around its content', () => {
    render(
      <MemoryRouter initialEntries={['/settings/system-settings']}>
        <SettingsShell>
          <div>settings content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('settings-logo')).toBeInTheDocument();
    expect(screen.getByTestId('settings-group-nav')).toBeInTheDocument();
    expect(screen.getByTestId('settings-search')).toBeInTheDocument();
    expect(screen.getByTestId('settings-help')).toBeInTheDocument();
    expect(screen.getByTestId('settings-user-center')).toHaveTextContent('settings-user-center');
    expect(screen.getByText('settings content')).toBeInTheDocument();
    expect(screen.queryByTestId('plugin-settings-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notifications-button')).not.toBeInTheDocument();
  });

  it('keeps its neutral header instead of following the business-side header color', () => {
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

    // 主题编辑器里的深色顶栏只作用于业务端；设置中心固定用容器底色。
    expect(screen.getByRole('banner')).toHaveStyle({ background: '#ffffff' });
  });

  it('preserves NocoBase custom tokens in the stored compact theme', () => {
    settingsThemeConfig = { algorithm: antdTheme.compactAlgorithm };

    render(
      <MemoryRouter initialEntries={['/settings/system-settings']}>
        <SettingsShell>
          <TokenProbe />
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('settings-theme-token')).toHaveTextContent('16:16');
  });

  it('places the settings content and embed container side by side below the header', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings/theme-editor']}>
        <SettingsShell>
          <div>settings content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    const header = screen.getByRole('banner');
    const content = screen.getByRole('main');
    const embedContainer = container.querySelector<HTMLElement>('#nocobase-embed-container');
    const workspace = content.parentElement;

    expect(embedContainer).not.toBeNull();
    if (!embedContainer) {
      throw new Error('Expected the Settings shell to render the global embed container');
    }
    expect(header.nextElementSibling).toBe(workspace);
    expect(workspace).toHaveStyle({
      display: 'flex',
      flex: '1',
      minWidth: '0',
      minHeight: '0',
      overflow: 'hidden',
    });
    expect(workspace?.children).toHaveLength(2);
    expect(workspace?.firstElementChild).toBe(content);
    expect(workspace?.lastElementChild).toBe(embedContainer);
    expect(content).toHaveStyle({
      flex: '1',
      minWidth: '0',
      minHeight: '0',
      overflow: 'hidden',
    });
    expect(embedContainer).toHaveStyle({
      flexShrink: '0',
      height: '100%',
      position: 'relative',
    });

    embedContainer.style.width = '33.3%';
    embedContainer.style.maxWidth = '800px';
    expect(workspace?.lastElementChild).toBe(embedContainer);
    expect(embedContainer).toHaveStyle({ width: '33.3%', maxWidth: '800px' });

    embedContainer.style.width = 'auto';
    embedContainer.style.maxWidth = 'none';
    expect(content).toHaveStyle({ flex: '1' });
    expect(embedContainer).toHaveStyle({ width: 'auto', maxWidth: 'none' });
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

  it('does not display the Settings header on the OAuth device verification route', () => {
    matchRoutes.mockReturnValue([
      { route: { id: 'settingsDetails' } },
      { route: { id: 'settingsDetails.idpOAuth.device' } },
    ]);

    render(
      <MemoryRouter initialEntries={['/settings/idpOAuth/device?user_code=TKHX-NNCC']}>
        <SettingsShell>
          <div>device verification content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByText('device verification content')).toBeInTheDocument();
    expect(document.querySelector('header')).toHaveStyle({ display: 'none' });
  });

  it('continues to display the Settings header on other details routes', () => {
    matchRoutes.mockReturnValue([
      { route: { id: 'settingsDetails' } },
      { route: { id: 'settingsDetails.workflow.workflows.id' } },
    ]);

    render(
      <MemoryRouter initialEntries={['/settings/workflow/workflows/1']}>
        <SettingsShell>
          <div>workflow details content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toBeVisible();
  });

  it('does not render the Settings header before authentication completes', () => {
    setCurrentUserAuthStatus(mockApp, 'unknown');

    render(
      <MemoryRouter initialEntries={['/settings/system-settings']}>
        <SettingsShell>
          <div>settings content</div>
        </SettingsShell>
      </MemoryRouter>,
    );

    expect(screen.getByText('settings content')).toBeInTheDocument();
    expect(document.querySelector('header')).toHaveStyle({ display: 'none' });
    expect(screen.queryByTestId('settings-logo')).not.toBeVisible();
  });
});
