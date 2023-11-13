import { SelectWithTitle, useAPIClient, useCurrentUserContext, useSystemSettings } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { MenuProps } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useCurrentThemeId } from '../components/InitializeTheme';
import { useThemeListContext } from '../components/ThemeListProvider';
import { useTranslation } from '../locale';
import { useUpdateThemeSettings } from './useUpdateThemeSettings';

export const useThemeSettings = () => {
  return useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'theme',
      eventKey: 'theme',
      label: <Label />,
    };
  }, []);
};

function Label() {
  const { t } = useTranslation();
  const currentUser = useCurrentUserContext();
  const systemSettings = useSystemSettings();
  const { run, error: err, data, refresh } = useThemeListContext();
  const { updateUserThemeSettings, updateSystemThemeSettings } = useUpdateThemeSettings();
  const currentThemeId = useCurrentThemeId();
  const themeId = useCurrentThemeId();
  const api = useAPIClient();

  const options = useMemo(() => {
    return data
      ?.filter((item) => item.optional)
      .map((item) => {
        return {
          label: t(item.config.name),
          value: item.id,
        };
      });
  }, [data, t]);

  useEffect(() => {
    if (!data) {
      run();
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // 当 themeId 为空时表示插件是第一次被启用
      if (themeId == null && data) {
        const firstTheme = data[0];

        try {
          // 避免并发请求，在本地存储中容易出问题
          await updateSystemThemeSettings(firstTheme.id);
          await updateUserThemeSettings(firstTheme.id);
        } catch (err) {
          error(err);
        }
      }
    };

    init();
  }, [themeId, updateSystemThemeSettings, updateUserThemeSettings, data, api, refresh]);

  if (err) {
    error(err);
    return null;
  }

  if (process.env.NODE_ENV !== 'production' && !currentUser) {
    throw new Error('Please check if provide `CurrentUserProvider` in your app.');
  }

  if (process.env.NODE_ENV !== 'production' && !systemSettings) {
    throw new Error('Please check if provide `SystemSettingsProvider` in your app.');
  }

  return (
    <SelectWithTitle
      title={t('Theme')}
      options={options}
      defaultValue={currentThemeId}
      onChange={(value) => {
        updateUserThemeSettings(value);
      }}
    />
  );
}
