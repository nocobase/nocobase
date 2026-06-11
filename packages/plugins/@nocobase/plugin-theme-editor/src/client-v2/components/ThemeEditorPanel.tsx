/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { defaultTheme, useGlobalTheme } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { error } from '@nocobase/utils/client';
import { App, Button, ConfigProvider, Input, Space, theme as antdTheme } from 'antd';
import antdEnUs from 'antd/locale/en_US';
import antdZhCN from 'antd/locale/zh_CN';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ThemeEditor, enUS, zhCN } from '../antd-token-previewer';
import { useT } from '../locale';
import type { ThemeConfig, ThemeItem } from '../types';
import { changeAlgorithmFromFunctionToString } from '../utils/changeAlgorithmFromFunctionToString';
import {
  getCurrentUserThemeId,
  getEffectiveCurrentThemeId,
  listThemeItems,
  THEME_RUNTIME_REFRESH_EVENT,
  updateUserTheme,
} from '../utils/themeApi';

const editorClassName = css({
  height: '100%',
});

interface ThemeEditorPanelProps {
  view: any;
  refresh?: () => void;
  editingTheme: ThemeItem | null;
  initialTheme: ThemeConfig;
  settingTheme: ThemeConfig;
}

const ThemeEditorPanel = (props: ThemeEditorPanelProps) => {
  const { view, refresh, editingTheme, initialTheme, settingTheme } = props;
  const ctx = useFlowContext();
  const t = useT();
  const { token } = antdTheme.useToken();
  const { message } = App.useApp();
  const {
    theme: globalTheme,
    setTheme: setGlobalTheme,
    setCurrentSettingTheme,
    setCurrentEditingTheme,
  } = useGlobalTheme();
  const editingThemeRef = useRef<ThemeItem | null>(editingTheme || null);
  const settingThemeRef = useRef<ThemeConfig>(settingTheme || defaultTheme);
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme || globalTheme);
  const [themeName, setThemeName] = useState<string>(
    editingThemeRef.current?.config?.name || initialTheme?.name || globalTheme.name || '',
  );
  const [loading, setLoading] = useState(false);
  const [themeNameStatus, setThemeNameStatus] = useState<'' | 'error' | 'warning'>();
  const lang = (ctx as any).i18n?.language;
  const Header = view.Header;

  const errorPlaceholderClassName = css({
    '&::placeholder': {
      color: token.colorErrorText,
    },
  });

  useLayoutEffect(() => {
    setCurrentSettingTheme(settingThemeRef.current);
    setCurrentEditingTheme(editingThemeRef.current as any);
    setGlobalTheme(initialTheme || defaultTheme);
  }, [initialTheme, setCurrentEditingTheme, setCurrentSettingTheme, setGlobalTheme]);

  const restoreTheme = useCallback(() => {
    setGlobalTheme(settingThemeRef.current || defaultTheme);
    setCurrentSettingTheme(null);
    setCurrentEditingTheme(null as any);
  }, [setCurrentEditingTheme, setCurrentSettingTheme, setGlobalTheme]);

  const closeEditor = useCallback(async () => {
    restoreTheme();
    await view.close(undefined, true);
  }, [restoreTheme, view]);

  useEffect(() => {
    const previousBeforeClose = view.beforeClose;
    const beforeClose = async (payload) => {
      restoreTheme();
      const result = await previousBeforeClose?.(payload);
      return result !== false;
    };

    view.beforeClose = beforeClose;

    return () => {
      if (view.beforeClose === beforeClose) {
        view.beforeClose = previousBeforeClose;
      }
    };
  }, [restoreTheme, view]);

  const handleThemeNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value;
    setThemeNameStatus(nextName ? '' : 'error');
    setThemeName(nextName);
  }, []);

  const handleSave = useCallback(async () => {
    if (!themeName) {
      setThemeNameStatus('error');
      return;
    }

    setLoading(true);

    const editingTheme = editingThemeRef.current;
    if (editingTheme) {
      const currentThemeId = getCurrentUserThemeId((ctx as any).user);
      const nextTheme = {
        ...editingTheme,
        config: {
          ...(changeAlgorithmFromFunctionToString(theme) as ThemeConfig),
          name: themeName,
        },
      };

      try {
        const themes = await listThemeItems(ctx.api);
        const shouldRefreshRuntime = editingTheme.id === getEffectiveCurrentThemeId(themes, currentThemeId);

        await ctx.api.request({
          url: `themeConfig:update/${editingTheme.id}`,
          method: 'POST',
          data: nextTheme,
        });
        if (shouldRefreshRuntime) {
          settingThemeRef.current = {
            ...theme,
            name: themeName,
          };
        }
        refresh?.();
        message.success(t('Saved successfully'));
        await closeEditor();
        if (shouldRefreshRuntime) {
          (ctx as any).app?.eventBus?.dispatchEvent(new Event(THEME_RUNTIME_REFRESH_EVENT));
        }
      } catch (err) {
        error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await ctx.api.request({
        url: 'themeConfig:create',
        method: 'POST',
        data: {
          config: {
            ...changeAlgorithmFromFunctionToString(theme),
            name: themeName,
          },
          optional: true,
          isBuiltIn: false,
        },
      });
      await updateUserTheme(ctx.api, response?.data?.data?.id ?? null);
      refresh?.();
      message.success(t('Saved successfully'));
      window.location.reload();
    } catch (err) {
      error(err);
      setLoading(false);
    }
  }, [closeEditor, ctx, message, refresh, t, theme, themeName]);

  return (
    <ConfigProvider theme={{ inherit: false }} locale={lang === 'zh-CN' ? antdZhCN : antdEnUs}>
      {Header ? (
        <Header
          title={editingThemeRef.current ? t('Edit theme') : t('Add new theme')}
          extra={
            <Space>
              <Input
                className={cx({ [errorPlaceholderClassName]: themeNameStatus === 'error' })}
                status={themeNameStatus}
                placeholder={t('Please set a name for this theme')}
                value={themeName}
                onChange={handleThemeNameChange}
                onPressEnter={handleSave}
                style={{ width: 240 }}
              />
              <Button loading={loading} type="primary" onClick={handleSave}>
                {t('Save')}
              </Button>
            </Space>
          }
        />
      ) : null}
      <ThemeEditor
        className={editorClassName}
        theme={{ name: 'Custom Theme', key: 'custom', config: theme }}
        style={{ height: '100%', width: '100%' }}
        embedded
        onThemeChange={(nextTheme) => {
          setTheme(nextTheme.config);
          setGlobalTheme(nextTheme.config);
        }}
        locale={lang === 'zh-CN' ? zhCN : enUS}
      />
    </ConfigProvider>
  );
};

ThemeEditorPanel.displayName = 'ThemeEditorPanel';

export default ThemeEditorPanel;
