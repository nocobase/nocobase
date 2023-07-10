import { useCurrentUserContext, useGlobalTheme, useSystemSettings } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { Spin } from 'antd';
import React, { useEffect } from 'react';
import { changeAlgorithmFromFunctionToString } from '../utils/changeAlgorithmFromFunctionToString';
import { changeAlgorithmFromStringToFunction } from '../utils/changeAlgorithmFromStringToFunction';
import { useThemeListContext } from './ThemeListProvider';

// 之所以存储到 localStorage 中，是为了防止登录页面主题不生效的问题
const CURRENT_THEME = 'CURRENT_THEME';

/**
 * 用于在页面加载时初始化主题
 */
const InitializeTheme: React.FC = ({ children }) => {
  const systemSettings = useSystemSettings();
  const currentUser = useCurrentUserContext();
  const { setTheme } = useGlobalTheme();
  const { run, data, loading } = useThemeListContext();

  useEffect(() => {
    const storageTheme = localStorage.getItem(CURRENT_THEME);
    if (storageTheme) {
      try {
        setTheme(changeAlgorithmFromStringToFunction(JSON.parse(storageTheme)).config);
      } catch (err) {
        error(err);
      }
    }
  }, []);

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
        localStorage.setItem(
          CURRENT_THEME,
          JSON.stringify(Object.assign({ ...theme }, { config: changeAlgorithmFromFunctionToString(theme.config) })),
        );
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
