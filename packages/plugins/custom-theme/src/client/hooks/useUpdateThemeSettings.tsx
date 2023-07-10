import { useAPIClient, useCurrentUserContext, useGlobalTheme } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { useCallback } from 'react';
import { useThemeListContext } from '../components/ThemeListProvider';

export function useUpdateThemeSettings() {
  const api = useAPIClient();
  const currentUser = useCurrentUserContext();
  const { data } = useThemeListContext();
  const { setTheme } = useGlobalTheme();

  const updateUserThemeSettings = useCallback(
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

  const updateUserThemeSettingsOnly = useCallback(
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

  return { updateUserThemeSettings, updateUserThemeSettingsOnly };
}
