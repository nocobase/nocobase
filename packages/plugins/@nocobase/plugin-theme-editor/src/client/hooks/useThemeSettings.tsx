import { SelectWithTitle, useAPIClient, useCurrentUserContext, useSystemSettings } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { MenuProps } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useThemeId } from '../components/InitializeTheme';
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
  const { run, error: err, data } = useThemeListContext();
  const { updateUserThemeSettings } = useUpdateThemeSettings();
  const { currentThemeId } = useThemeId();

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
