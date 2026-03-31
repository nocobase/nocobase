/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MappingAlgorithm, theme } from 'antd';
import { ThemeConfig } from './type';

/**
 * 该算法用于计算自定义的一些 token
 */
export const customAlgorithm: MappingAlgorithm = (designToken, derivativeToken) => {
  const result: ThemeConfig['token'] = derivativeToken || theme.defaultAlgorithm(designToken);

  result.paddingPageHorizontal ??= result.sizeLG;
  result.paddingPageVertical ??= result.sizeLG;
  result.paddingPopupHorizontal ??= result.sizeLG;
  result.paddingPopupVertical ??= result.size;
  result.marginBlock ??= result.sizeLG;
  result.borderRadiusBlock ??= result.borderRadiusLG;

  // 侧边菜单栏
  result.colorBgSider ??= result.colorBgElevated;
  result.colorBgSiderMenuHover ??= result.colorBgTextHover || result.colorFillSecondary;
  result.colorBgSiderMenuActive ??= result.colorPrimaryBg;
  result.colorTextSiderMenu ??= result.colorText;
  result.colorTextSiderMenuHover ??= result.colorText;
  result.colorTextSiderMenuActive ??= result.colorPrimary;

  return result as any;
};

export const addCustomAlgorithmToTheme = (theme: ThemeConfig) => {
  if (Array.isArray(theme.algorithm)) {
    if (!theme.algorithm.includes(customAlgorithm)) {
      theme.algorithm.push(customAlgorithm);
    }
  } else {
    theme.algorithm = [theme.algorithm, customAlgorithm].filter(Boolean);
  }
  theme.algorithm = theme.algorithm.filter(Boolean);
  return theme;
};
