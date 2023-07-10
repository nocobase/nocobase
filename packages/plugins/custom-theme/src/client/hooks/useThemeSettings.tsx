import { useCurrentUserContext } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { MenuProps, Select } from 'antd';
import React, { useEffect, useMemo } from 'react';
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
  const { run, error: err, data } = useThemeListContext();
  const { updateUserThemeSettings } = useUpdateThemeSettings();

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
        value={currentUser.data.data.systemSettings.theme}
        options={data
          ?.filter((item) => item.optional)
          .map((item) => {
            return {
              label: t(item.config.name),
              value: item.id,
            };
          })}
        onChange={(value) => {
          updateUserThemeSettings(value);
        }}
      />
    </div>
  );
}
