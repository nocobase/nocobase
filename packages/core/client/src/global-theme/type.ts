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
  /** 顶部导航栏主色 */
  colorPrimaryHeader: string;
  /** 导航栏背景色 */
  colorBgHeader: string;
  /** 导航栏菜单背景色悬浮态 */
  colorBgHeaderMenuHover: string;
  /** 导航栏菜单背景色激活态 */
  colorBgHeaderMenuActive: string;
  /** 导航栏菜单文本色 */
  colorTextHeaderMenu: string;
  /** 导航栏菜单文本色悬浮态 */
  colorTextHeaderMenuHover: string;
  /** 导航栏菜单文本色激活态 */
  colorTextHeaderMenuActive: string;

  /** UI 配置色 */
  colorSettings: string;
  /** 鼠标悬浮时显示的背景色 */
  colorBgSettingsHover: string;
  /** 鼠标悬浮模板区块时显示的背景色 */
  colorTemplateBgSettingsHover: string;
  /** 鼠标悬浮时显示的边框色 */
  colorBorderSettingsHover: string;

  /** 页面左右内边距 */
  paddingPageHorizontal: number;
  /** 页面上下内边距 */
  paddingPageVertical: number;

  /** 弹窗左右内边距 */
  paddingPopupHorizontal: number;
  /** 弹窗上下内边距 */
  paddingPopupVertical: number;

  /** 区块之间的间隔 */
  marginBlock: number;
  /** 区块的圆角 */
  borderRadiusBlock: number;

  siderWidth: number;
}

export interface ThemeConfig extends _ThemeConfig {
  name?: string;
  token?: Partial<CustomToken>;
}
