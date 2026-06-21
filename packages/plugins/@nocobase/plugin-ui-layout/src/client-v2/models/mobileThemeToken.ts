/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider, theme, type ThemeConfig } from 'antd';
import React from 'react';

export type MobileLayoutThemeToken = {
  colorSettings?: string;
  colorTextHeaderMenu?: string;
};

export type MobileLayoutCompactThemeToken = NonNullable<ThemeConfig['token']> &
  MobileLayoutThemeToken & {
    borderRadiusBlock?: number;
    marginBlock?: number;
    marginSM?: number;
    paddingLG?: number;
    paddingPageHorizontal?: number;
    paddingPageVertical?: number;
    paddingSM?: number;
    paddingXS?: number;
  };

export function toMobileCompactThemeToken(
  token?: Partial<MobileLayoutCompactThemeToken>,
): MobileLayoutCompactThemeToken {
  return {
    ...(token || {}),
    borderRadiusBlock: 8,
    fontSize: 16,
    marginBlock: 12,
    marginSM: 8,
    paddingLG: 16,
    paddingPageHorizontal: 8,
    paddingPageVertical: 8,
    paddingSM: 8,
    paddingXS: 8,
  } as MobileLayoutCompactThemeToken;
}

function isDarkThemeConfig(themeConfig?: ThemeConfig) {
  const algorithm = themeConfig?.algorithm;

  if (Array.isArray(algorithm)) {
    return algorithm.includes(theme.darkAlgorithm);
  }

  return algorithm === theme.darkAlgorithm;
}

export function useMobileCompactTheme(): ThemeConfig {
  const config = React.useContext(ConfigProvider.ConfigContext);
  const { token } = theme.useToken();
  const parentTheme = config?.theme;
  const parentToken = parentTheme?.token as MobileLayoutCompactThemeToken | undefined;
  const customToken = token as typeof token & MobileLayoutThemeToken;
  const isDarkTheme = isDarkThemeConfig(parentTheme);

  return React.useMemo<ThemeConfig>(
    () => ({
      cssVar: parentTheme?.cssVar,
      hashed: parentTheme?.hashed,
      inherit: false,
      token: toMobileCompactThemeToken({
        colorBgBase: parentToken?.colorBgBase ?? token.colorBgBase,
        colorError: parentToken?.colorError ?? token.colorError,
        colorInfo: parentToken?.colorInfo ?? token.colorInfo,
        colorLink: parentToken?.colorLink ?? token.colorLink,
        colorPrimary: parentToken?.colorPrimary ?? token.colorPrimary,
        colorSettings: customToken.colorSettings,
        colorSuccess: parentToken?.colorSuccess ?? token.colorSuccess,
        colorTextBase: parentToken?.colorTextBase ?? token.colorTextBase,
        colorTextHeaderMenu: customToken.colorTextHeaderMenu,
        colorWarning: parentToken?.colorWarning ?? token.colorWarning,
      }),
      algorithm: isDarkTheme ? [theme.compactAlgorithm, theme.darkAlgorithm] : theme.compactAlgorithm,
    }),
    [
      customToken.colorSettings,
      customToken.colorTextHeaderMenu,
      isDarkTheme,
      parentTheme?.cssVar,
      parentTheme?.hashed,
      parentToken?.colorBgBase,
      parentToken?.colorError,
      parentToken?.colorInfo,
      parentToken?.colorLink,
      parentToken?.colorPrimary,
      parentToken?.colorSuccess,
      parentToken?.colorTextBase,
      parentToken?.colorWarning,
      token.colorBgBase,
      token.colorError,
      token.colorInfo,
      token.colorLink,
      token.colorPrimary,
      token.colorSuccess,
      token.colorTextBase,
      token.colorWarning,
    ],
  );
}
