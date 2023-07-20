import { useAPIClient, useToken } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { Space } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { useUpdateThemeSettings } from '../hooks/useUpdateThemeSettings';
import { useCurrentThemeId } from './InitializeTheme';
import ThemeCard from './ThemeCard';
import { useThemeListContext } from './ThemeListProvider';
import ToEditTheme from './ToEditTheme';

const ThemeList = () => {
  const { run, error: err, refresh, data } = useThemeListContext();
  const themeId = useCurrentThemeId();
  const { updateSystemThemeSettings, updateUserThemeSettings } = useUpdateThemeSettings();
  const { token } = useToken();
  const api = useAPIClient();

  useEffect(() => {
    if (!data) {
      run();
    }
  }, []);

  useEffect(() => {
    // 当 themeId 为空时表示插件是第一次被启用
    if (themeId == null && data) {
      const firstTheme = data[0];

      // 把第一个主题设置为可被用户选择
      api.request({
        url: `themeConfig:update/${firstTheme.id}`,
        method: 'post',
        data: {
          optional: true,
        },
      });

      // 避免并发请求，在本地存储中容易出问题
      updateSystemThemeSettings(firstTheme.id)
        .then(() => {
          updateUserThemeSettings(firstTheme.id);
        })
        .catch((err) => {
          error(err);
        });
    }
  }, [themeId, updateSystemThemeSettings, updateUserThemeSettings, data, api]);

  const handleChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (err) {
    error(err);
    return null;
  }

  return (
    <Space size={token.sizeLG} wrap>
      {data?.map((item) => {
        return <ThemeCard item={item} key={item.id} onChange={handleChange} />;
      })}
      <ToEditTheme />
    </Space>
  );
};

ThemeList.displayName = 'ThemeList';

export default ThemeList;
