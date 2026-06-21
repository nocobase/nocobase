/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ThemeConfig as _ThemeConfig } from 'antd';
import { AliasToken } from 'antd/es/theme/internal';

export interface CustomToken extends AliasToken {
  colorPrimaryHeader: string;
  colorBgHeader: string;
  colorBgHeaderMenuHover: string;
  colorBgHeaderMenuActive: string;
  colorTextHeaderMenu: string;
  colorTextHeaderMenuHover: string;
  colorTextHeaderMenuActive: string;

  colorBgSider: string;
  colorTextSiderMenu: string;
  colorTextSiderMenuHover: string;
  colorTextSiderMenuActive: string;
  colorBgSiderMenuHover: string;
  colorBgSiderMenuActive: string;

  colorSettings: string;
  colorBgSettingsHover: string;
  colorTemplateBgSettingsHover: string;
  colorBorderSettingsHover: string;

  paddingPageHorizontal: number;
  paddingPageVertical: number;

  paddingPopupHorizontal: number;
  paddingPopupVertical: number;

  marginBlock: number;
  borderRadiusBlock: number;

  siderWidth: number;
  globalStyle?: string;
}

export interface ThemeConfig extends _ThemeConfig {
  name?: string;
  token?: Partial<CustomToken>;
}
