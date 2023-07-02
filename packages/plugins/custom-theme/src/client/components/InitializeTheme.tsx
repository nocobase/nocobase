import { useCurrentUserContext, useGlobalTheme } from '@nocobase/client';
import { Spin } from 'antd';
import React, { useEffect } from 'react';
import { useThemeListContext } from './ThemeListProvider';

/**
 * 用于在页面加载时初始化主题
 */
const InitializeTheme: React.FC = ({ children }) => {
  const currentUser = useCurrentUserContext();
  const { setTheme } = useGlobalTheme();
  const { run, data, loading } = useThemeListContext();

  useEffect(() => {
    if (!data) {
      return run();
    }

    let themeId;
    if ((themeId = currentUser?.data?.data?.systemSettings?.theme) !== undefined) {
      const theme = data?.find((item) => item.id === themeId);
      if (theme) {
        setTheme(theme.config);
      }
    }
  }, [currentUser?.data?.data?.systemSettings?.theme, data]);

  if (loading && !data) {
    return <Spin />;
  }

  return <>{children}</>;
};

InitializeTheme.displayName = 'InitializeTheme';

export default InitializeTheme;
