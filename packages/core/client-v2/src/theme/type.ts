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

  /**
   * 「选中项」的底色与压在其上的文字色。
   *
   * antd 只给了 `controlItemBgActive` 一个背景 token，没有配对的文字色，于是各页面
   * 自己写背景、文字色照旧，底色一变深就成了深底深字。这一对补齐了那半边：
   * 列表行、树节点、卡片这类自绘选中态统一读它，未设置时回落到 antd 的默认表现。
   */
  colorBgItemActive: string;
  colorTextItemActive: string;

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
