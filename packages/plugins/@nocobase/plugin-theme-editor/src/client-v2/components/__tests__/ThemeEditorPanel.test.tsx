/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ThemeConfig, ThemeItem } from '../../types';
import ThemeEditorPanel from '../ThemeEditorPanel';

const mocks = vi.hoisted(() => ({
  dispatchEvent: vi.fn(),
  request: vi.fn(),
  setCurrentEditingTheme: vi.fn(),
  setCurrentSettingTheme: vi.fn(),
  setGlobalTheme: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  defaultTheme: { name: 'Default theme', token: {} },
  useGlobalTheme: () => ({
    theme: { name: 'Current global theme', token: {} },
    setTheme: mocks.setGlobalTheme,
    setCurrentSettingTheme: mocks.setCurrentSettingTheme,
    setCurrentEditingTheme: mocks.setCurrentEditingTheme,
  }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    i18n: { language: 'en-US' },
    user: { systemSettings: { themeId: 1 } },
    api: {
      request: mocks.request,
    },
    app: {
      eventBus: {
        dispatchEvent: mocks.dispatchEvent,
      },
    },
  }),
}));

vi.mock('@nocobase/utils/client', () => ({
  error: vi.fn(),
}));

vi.mock('../../antd-token-previewer', () => ({
  enUS: {},
  zhCN: {},
  ThemeEditor: ({ onThemeChange }: { onThemeChange: (theme: { config: ThemeConfig }) => void }) => (
    <button
      type="button"
      data-testid="change-theme"
      onClick={() =>
        onThemeChange({
          config: {
            name: 'Preview theme',
            token: {
              colorPrimary: '#00b96b',
            },
          },
        })
      }
    >
      Change theme
    </button>
  ),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('ThemeEditorPanel', () => {
  const settingTheme: ThemeConfig = {
    name: 'Theme before editing',
    token: {
      colorPrimary: '#1677ff',
    },
  };

  const editingTheme: ThemeItem = {
    id: 1,
    config: {
      name: 'Theme before editing',
      token: {
        colorPrimary: '#1677ff',
      },
    },
    optional: true,
  };

  const Header = ({ extra }: { extra: React.ReactNode }) => <div>{extra}</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockImplementation(async ({ url }: { url: string }) => {
      if (url === 'themeConfig:list') {
        return {
          data: {
            data: [editingTheme],
          },
        };
      }

      if (url === 'themeConfig:update/1') {
        return {};
      }

      throw new Error(`Unexpected request: ${url}`);
    });
  });

  it('clears the restore baseline after saving the active theme', async () => {
    const close = vi.fn().mockResolvedValue(undefined);

    render(
      <App>
        <ThemeEditorPanel
          view={{ Header, close }}
          editingTheme={editingTheme}
          initialTheme={editingTheme.config}
          settingTheme={settingTheme}
        />
      </App>,
    );

    fireEvent.click(screen.getByTestId('change-theme'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(close).toHaveBeenCalledWith(undefined, true);
    });

    expect(mocks.setGlobalTheme).toHaveBeenLastCalledWith({
      name: 'Theme before editing',
      token: {
        colorPrimary: '#00b96b',
      },
    });
    expect(mocks.setCurrentSettingTheme).toHaveBeenLastCalledWith(null);
  });
});
