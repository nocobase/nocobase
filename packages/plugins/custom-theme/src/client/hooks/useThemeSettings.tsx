import { useAPIClient, useCurrentUserContext, useGlobalTheme } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { MenuProps, Select } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useThemeListContext } from '../components/ThemeListProvider';
import { useTranslation } from '../locale';

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
  const { updateThemeSettings } = useUpdateThemeSettings();

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
          updateThemeSettings(value);
        }}
      />
    </div>
  );
}

export function useUpdateThemeSettings() {
  const api = useAPIClient();
  const currentUser = useCurrentUserContext();
  const { data } = useThemeListContext();
  const { setTheme } = useGlobalTheme();

  const updateThemeSettings = useCallback(
    async (themeId: number | null) => {
      try {
        await api.resource('users').update({
          filterByTk: currentUser.data.data.id,
          values: {
            systemSettings: {
              ...currentUser.data.data.systemSettings,
              theme: themeId,
            },
          },
        });
        currentUser.mutate({
          data: {
            ...currentUser.data.data,
            systemSettings: {
              ...currentUser.data.data.systemSettings,
              theme: themeId,
            },
          },
        });
        setTheme(data.find((item) => item.id === themeId)?.config || {});
      } catch (err) {
        error(err);
      }
    },
    [api, currentUser, data, setTheme],
  );

  const updateThemeSettingsOnly = useCallback(
    async (themeId: number) => {
      try {
        await api.resource('users').update({
          filterByTk: currentUser.data.data.id,
          values: {
            systemSettings: {
              ...currentUser.data.data.systemSettings,
              theme: themeId,
            },
          },
        });
        currentUser.mutate({
          data: {
            ...currentUser.data.data,
            systemSettings: {
              ...currentUser.data.data.systemSettings,
              theme: themeId,
            },
          },
        });
      } catch (err) {
        error(err);
      }
    },
    [api, currentUser, data, setTheme],
  );

  return { updateThemeSettings, updateThemeSettingsOnly };
}
