import { defaultTheme as presetTheme, useAPIClient, useCurrentUserContext, useGlobalTheme } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import { Spin } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { changeAlgorithmFromFunctionToString } from '../utils/changeAlgorithmFromFunctionToString';
import { changeAlgorithmFromStringToFunction } from '../utils/changeAlgorithmFromStringToFunction';
import { useThemeListContext } from './ThemeListProvider';

const ThemeIdContext = React.createContext<{
  currentThemeId: number;
  defaultThemeId: number;
}>({} as any);

export const useThemeId = () => {
  return React.useContext(ThemeIdContext);
};

/**
 * 用于在页面加载时初始化主题
 */
const InitializeTheme: React.FC = ({ children }) => {
  const currentUser = useCurrentUserContext();
  const { setTheme } = useGlobalTheme();
  const { run, data, loading } = useThemeListContext();
  const defaultTheme = useMemo(() => data?.find((item) => item.default), [data]);
  const themeId = useRef<number>(null);
  const api = useAPIClient();

  useEffect(() => {
    const storageTheme = api.auth.getOption('theme');
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

    const currentThemeId = currentUser?.data?.data?.systemSettings?.themeId;
    let theme: any;
    if (currentThemeId !== null && currentThemeId !== undefined) {
      // Use the theme from the current user's system settings
      theme = data.find((item) => item.id === currentThemeId);
    }
    if (!theme) {
      // Use the default theme if there is not an available theme in user's system settings
      theme = defaultTheme;
    }
    if (theme) {
      themeId.current = theme.id;
      setTheme(theme.config);
      api.auth.setOption(
        'theme',
        JSON.stringify(Object.assign({ ...theme }, { config: changeAlgorithmFromFunctionToString(theme.config) })),
      );
    } else {
      // Use the preset theme if the theme is not found
      setTheme(presetTheme);
      api.auth.setOption('theme', null);
    }
  }, [api.auth, currentUser?.data?.data?.systemSettings?.themeId, data, run, setTheme, defaultTheme]);

  if (loading && !data) {
    return <Spin />;
  }

  return (
    <ThemeIdContext.Provider
      value={{
        currentThemeId: themeId.current,
        defaultThemeId: defaultTheme?.id,
      }}
    >
      {children}
    </ThemeIdContext.Provider>
  );
};

InitializeTheme.displayName = 'InitializeTheme';

export default InitializeTheme;
