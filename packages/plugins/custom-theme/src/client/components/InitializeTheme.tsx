import { useCurrentUserContext, useGlobalTheme, useSystemSettings } from '@nocobase/client';
import { Spin } from 'antd';
import React, { useEffect } from 'react';
import { useThemeListContext } from './ThemeListProvider';

/**
 * 用于在页面加载时初始化主题
 */
const InitializeTheme: React.FC = ({ children }) => {
  const systemSettings = useSystemSettings();
  const currentUser = useCurrentUserContext();
  const { setTheme } = useGlobalTheme();
  const { run, data, loading } = useThemeListContext();

  useEffect(() => {
    if (!data) {
      return run();
    }

    const themeId =
      currentUser?.data?.data?.systemSettings?.themeId === undefined
        ? systemSettings?.data?.data?.options?.themeId
        : currentUser?.data?.data?.systemSettings?.themeId;

    if (themeId !== undefined) {
      const theme = data?.find((item) => item.id === themeId);
      if (theme) {
        setTheme(theme.config);
      }
    }
  }, [
    currentUser?.data?.data?.systemSettings?.themeId,
    data,
    run,
    setTheme,
    systemSettings?.data?.data?.options?.themeId,
  ]);

  if (loading && !data) {
    return <Spin />;
  }

  return <>{children}</>;
};

InitializeTheme.displayName = 'InitializeTheme';

export default InitializeTheme;
