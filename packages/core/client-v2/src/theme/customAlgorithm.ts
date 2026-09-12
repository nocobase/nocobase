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

export const customAlgorithm: MappingAlgorithm = (designToken, derivativeToken) => {
  const result: ThemeConfig['token'] = derivativeToken || theme.defaultAlgorithm(designToken);

  result.paddingPageHorizontal ??= result.sizeLG;
  result.paddingPageVertical ??= result.sizeLG;
  result.paddingPopupHorizontal ??= result.sizeLG;
  result.paddingPopupVertical ??= result.size;
  result.marginBlock ??= result.sizeLG;
  result.borderRadiusBlock ??= result.borderRadiusLG;

  result.colorBgSider ??= result.colorBgElevated;
  result.colorBgSiderMenuHover ??= result.colorBgTextHover || result.colorFillSecondary;
  result.colorBgSiderMenuActive ??= result.colorPrimaryBg;
  result.colorTextSiderMenu ??= result.colorText;
  result.colorTextSiderMenuHover ??= result.colorText;
  result.colorTextSiderMenuActive ??= result.colorPrimary;

  return result as any;
};

export const addCustomAlgorithmToTheme = (themeConfig: ThemeConfig) => {
  if (Array.isArray(themeConfig.algorithm)) {
    if (!themeConfig.algorithm.includes(customAlgorithm)) {
      themeConfig.algorithm.push(customAlgorithm);
    }
  } else {
    themeConfig.algorithm = [themeConfig.algorithm, customAlgorithm].filter(Boolean);
  }
  themeConfig.algorithm = themeConfig.algorithm.filter(Boolean);
  return themeConfig;
};
