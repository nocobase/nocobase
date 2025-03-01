/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider, theme as antdTheme } from 'antd';
import _ from 'lodash';
import React, { createContext, FC, useCallback, useMemo, useRef } from 'react';
import compatOldTheme from './compatOldTheme';
import { addCustomAlgorithmToTheme } from './customAlgorithm';
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

interface GlobalThemeProviderProps {
  theme?: ThemeConfig;
}

export const GlobalThemeProvider: FC<GlobalThemeProviderProps> = ({ children, theme: themeFromProps }) => {
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
    const finalTheme = addCustomAlgorithmToTheme(theme);
    if (process.env.__E2E__) {
      // Ant design 升级到5.2后 Modal 组件在 E2E 测试中会有问题，需要打开动画，否则会导致弹窗遮罩无法关闭
      finalTheme.components = {
        ...finalTheme.components,
        Modal: {
          motion: true,
          motionDurationFast: '0.01ms',
          motionDurationMid: '0.01ms',
          motionDurationSlow: '0.01ms',
        },
      };
    }
    return {
      theme: finalTheme,
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
      <ConfigProvider theme={compatOldTheme(value.theme)}>{children}</ConfigProvider>
    </GlobalThemeContext.Provider>
  );
};

export { default as AntdAppProvider } from './AntdAppProvider';
export { default as compatOldTheme } from './compatOldTheme';
export * from './type';
export { defaultTheme };
