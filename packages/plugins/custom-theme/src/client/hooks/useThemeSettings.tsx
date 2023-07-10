import { useCurrentUserContext, useSystemSettings } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { MenuProps, Select } from 'antd';
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
  const { run, error: err, data } = useThemeListContext();
  const { updateUserThemeSettings } = useUpdateThemeSettings();
  const currentThemeId = useCurrentThemeId();

  const options = useMemo(() => {
    return data
      ?.filter((item) => item.optional)
      .map((item) => {
        return {
          label: t(item.config.name),
          value: item.id,
        };
      });
  }, [data]);

  useEffect(() => {
    if (!data) {
      run();
    }
  }, []);

  if (err) {
    error(err);
    return null;
  }

  if (!currentUser?.data?.data?.systemSettings) {
    error('Please check if provide `CurrentUserProvider` in your app.');
    throw new Error('Please check if provide `CurrentUserProvider` in your app.');
  }

  if (!systemSettings?.data?.data?.options) {
    error('Please check if provide `SystemSettingsProvider` in your app.');
    throw new Error('Please check if provide `SystemSettingsProvider` in your app.');
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {t('Theme')}
      <Select
        style={{ minWidth: 100 }}
        bordered={false}
        popupMatchSelectWidth={false}
        value={currentThemeId}
        options={options}
        onChange={(value) => {
          updateUserThemeSettings(value);
        }}
      />
    </div>
  );
}
