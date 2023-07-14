import { ConfigProvider, type ThemeConfig as Config } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useMemo, useRef } from 'react';

type ThemeConfig = Config & { name?: string; algorithm?: string | Config['algorithm'] };

interface ThemeItem {
  id: number;
  /** 主题配置内容，一个 JSON 字符串 */
  config: ThemeConfig;
  /** 主题是否可选 */
  optional: boolean;
  isBuiltIn?: boolean;
}

const GlobalThemeContext = createContext<{
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  setCurrentSettingTheme: (theme: ThemeConfig) => void;
  getCurrentSettingTheme: () => ThemeConfig;
  setCurrentEditingTheme: (themeItem: ThemeItem) => void;
  getCurrentEditingTheme: () => ThemeItem;
}>(null);

export const useGlobalTheme = () => {
  return React.useContext(GlobalThemeContext);
};

export const GlobalThemeProvider = ({ children, theme: defaultTheme }) => {
  const [theme, setTheme] = React.useState<ThemeConfig>(defaultTheme || { name: 'Custom theme' });
  const currentSettingThemeRef = useRef<ThemeConfig>(null);
  const currentEditingThemeRef = useRef<ThemeItem>(null);

  const setCurrentEditingTheme = useCallback((themeItem: ThemeItem) => {
    currentEditingThemeRef.current = themeItem ? _.cloneDeep(themeItem) : themeItem;
  }, []);

  const getCurrentEditingTheme = useCallback(() => {
    return currentEditingThemeRef.current;
  }, []);

  const setCurrentSettingTheme = useCallback((theme: ThemeConfig) => {
    currentSettingThemeRef.current = theme ? _.cloneDeep(theme) : theme;
  }, []);

  const getCurrentSettingTheme = useCallback(() => {
    return currentSettingThemeRef.current;
  }, []);

  const value = useMemo(() => {
    return {
      theme,
      setTheme,
      setCurrentSettingTheme,
      getCurrentSettingTheme,
      setCurrentEditingTheme,
      getCurrentEditingTheme,
    };
  }, [theme]);

  return (
    <GlobalThemeContext.Provider value={value}>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </GlobalThemeContext.Provider>
  );
};

export { default as AntdAppProvider } from './AntdAppProvider';
