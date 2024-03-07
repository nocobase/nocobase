import { ConfigProvider, theme as antdTheme } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useMemo, useRef } from 'react';
import compatOldTheme from './compatOldTheme';
import defaultTheme from './defaultTheme';
import { ThemeConfig } from './type';

interface ThemeItem {
  id: number;
  /** 主题配置内容，一个 JSON 字符串 */
  config: ThemeConfig;
  /** 主题是否可选 */
  optional: boolean;
  isBuiltIn?: boolean;
}

interface GlobalThemeContextProps {
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  setCurrentSettingTheme: (theme: ThemeConfig) => void;
  getCurrentSettingTheme: () => ThemeConfig;
  setCurrentEditingTheme: (themeItem: ThemeItem) => void;
  getCurrentEditingTheme: () => ThemeItem;
  isDarkTheme: boolean;
}

const GlobalThemeContext = createContext<GlobalThemeContextProps>(null);
GlobalThemeContext.displayName = 'GlobalThemeContext';

export const useGlobalTheme = () => {
  return React.useContext(GlobalThemeContext) || ({ theme: {}, isDarkTheme: false } as GlobalThemeContextProps);
};

export const GlobalThemeProvider = ({ children, theme: themeFromProps }) => {
  const [theme, setTheme] = React.useState<ThemeConfig>(themeFromProps || defaultTheme);
  const currentSettingThemeRef = useRef<ThemeConfig>(null);
  const currentEditingThemeRef = useRef<ThemeItem>(null);

  const isDarkTheme = useMemo(() => {
    const algorithm = theme?.algorithm;
    if (Array.isArray(algorithm)) {
      return algorithm.includes(antdTheme.darkAlgorithm);
    }
    return algorithm === antdTheme.darkAlgorithm;
  }, [theme?.algorithm]);

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
      isDarkTheme,
    };
  }, [
    getCurrentEditingTheme,
    getCurrentSettingTheme,
    isDarkTheme,
    setCurrentEditingTheme,
    setCurrentSettingTheme,
    theme,
  ]);

  return (
    <GlobalThemeContext.Provider value={value}>
      <ConfigProvider theme={compatOldTheme(theme)}>{children}</ConfigProvider>
    </GlobalThemeContext.Provider>
  );
};

export { default as AntdAppProvider } from './AntdAppProvider';
export { default as compatOldTheme } from './compatOldTheme';
export * from './type';
export { defaultTheme };
