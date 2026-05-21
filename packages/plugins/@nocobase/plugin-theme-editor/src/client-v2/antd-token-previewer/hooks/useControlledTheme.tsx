/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DerivativeFunc } from '@ant-design/cssinjs';
import { theme as antTheme } from 'antd';
import type { ThemeConfig } from 'antd/es/config-provider/context';
import { useEffect, useRef, useState } from 'react';
import type { MutableTheme, Theme } from '../interface';
import deepUpdateObj from '../utils/deepUpdateObj';
import getDesignToken from '../utils/getDesignToken';
import getValueByPath from '../utils/getValueByPath';

const { darkAlgorithm: defaultDark, compactAlgorithm, defaultAlgorithm } = antTheme;

export type ThemeCode = 'default' | 'dark' | 'compact';
export const themeMap: Record<ThemeCode, DerivativeFunc<any, any>> = {
  dark: defaultDark,
  compact: compactAlgorithm,
  default: defaultAlgorithm,
};

export type SetThemeState = (theme: Theme, modifiedPath: string[], updated?: boolean) => void;

export type UseControlledTheme = (options: {
  theme?: Theme;
  defaultTheme: Theme;
  onChange?: (theme: Theme) => void;
  darkAlgorithm?: DerivativeFunc<any, any>;
}) => {
  theme: MutableTheme;
  infoFollowPrimary: boolean;
  onInfoFollowPrimaryChange: (value: boolean) => void;
  updateRef: () => void;
};

const useControlledTheme: UseControlledTheme = ({ theme: customTheme, defaultTheme, onChange }) => {
  const [theme, setTheme] = useState<Theme>(customTheme ?? defaultTheme);
  const [infoFollowPrimary, setInfoFollowPrimary] = useState<boolean>(false);
  const themeRef = useRef<Theme>(theme);
  const [, setRenderHolder] = useState(0);

  const forceUpdate = () => setRenderHolder((prev) => prev + 1);

  const getNewTheme = (newTheme: Theme, force?: boolean): Theme => {
    const newToken = { ...newTheme.config.token };
    if (infoFollowPrimary || force) {
      newToken.colorInfo = getDesignToken(newTheme.config).colorPrimary;
    }
    return { ...newTheme, config: { ...newTheme.config, token: newToken } };
  };

  const handleSetTheme: SetThemeState = (newTheme) => {
    if (customTheme) {
      onChange?.(getNewTheme(newTheme));
    } else {
      setTheme(getNewTheme(newTheme));
    }
  };

  const handleResetTheme = (path: string[]) => {
    let newConfig = { ...theme.config };
    newConfig = deepUpdateObj(newConfig, path, getValueByPath(themeRef.current?.config, path));

    if (path[1] === 'colorSettings') {
      newConfig = deepUpdateObj(
        newConfig,
        ['token', 'colorBgSettingsHover'],
        getValueByPath(themeRef.current?.config, ['token', 'colorBgSettingsHover']),
      );
      newConfig = deepUpdateObj(
        newConfig,
        ['token', 'colorTemplateBgSettingsHover'],
        getValueByPath(themeRef.current?.config, ['token', 'colorTemplateBgSettingsHover']),
      );
      newConfig = deepUpdateObj(
        newConfig,
        ['token', 'colorBorderSettingsHover'],
        getValueByPath(themeRef.current?.config, ['token', 'colorBorderSettingsHover']),
      );
    }

    handleSetTheme({ ...theme, config: newConfig }, path);
  };

  const getCanReset = (origin: ThemeConfig, current: ThemeConfig) => (path: string[]) => {
    return getValueByPath(origin, path) !== getValueByPath(current, path);
  };

  // Controlled theme change
  useEffect(() => {
    if (customTheme) {
      setTheme(customTheme);
    }
  }, [customTheme]);

  const handleInfoFollowPrimaryChange = (value: boolean) => {
    setInfoFollowPrimary(value);
    if (value) {
      setTheme(getNewTheme(theme, true));
    }
  };

  return {
    theme: {
      ...theme,
      onThemeChange: (config, path) => handleSetTheme({ ...theme, config }, path),
      onReset: handleResetTheme,
      getCanReset: getCanReset(themeRef.current?.config, theme.config),
    },
    infoFollowPrimary,
    onInfoFollowPrimaryChange: handleInfoFollowPrimaryChange,
    updateRef: () => {
      themeRef.current = theme;
      forceUpdate();
    },
  };
};

export default useControlledTheme;
