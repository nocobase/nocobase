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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsShell } from '../settings-app/SettingsShell';
import type { ThemeConfig } from '../theme';

const userCenterModel = { uid: 'settings-user-center' };
const createModel = vi.fn(() => userCenterModel);

vi.mock('../hooks/useApp', () => ({
  useApp: () => ({
    flowEngine: {
      createModel,
      getModel: vi.fn(() => null),
      getModelClass: vi.fn(() => true),
    },
  }),
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
  });

  it('renders only the settings brand, group nav, help and user center around its content', () => {
    render(
      <SettingsShell>
        <div>settings content</div>
      </SettingsShell>,
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

  it('follows the shared header color instead of pinning its own', () => {
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
        <SettingsShell>
          <div>settings content</div>
        </SettingsShell>
      </ConfigProvider>,
    );

    expect(screen.getByRole('banner')).toHaveStyle({ background: '#001529' });
  });
});
