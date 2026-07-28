/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GlobalToken, ThemeConfig } from 'antd';

const NEUTRAL_PRIMARY_LIGHT = '#1f1f1f';
const NEUTRAL_PRIMARY_DARK = '#e8e8e8';

/**
 * 粗略判断一个颜色是不是深色背景。
 *
 * 只支持 `#rgb` / `#rrggbb`，解析不出来时按浅色处理。
 *
 * @param {string | undefined} color 背景色
 * @returns {boolean} 是否为深色
 */
export function isDarkColor(color?: string) {
  if (typeof color !== 'string') {
    return false;
  }

  const hex = color.trim().replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex;

  if (normalized.length !== 6 || /[^0-9a-f]/i.test(normalized)) {
    return false;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  // Rec. 601 亮度
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/**
 * 构造设置中心的中性灰白主题。
 *
 * 设置中心刻意不跟业务端抢彩色：顶栏用容器底色 + 细分割线，
 * 主色收敛成中性深灰，让「配置」和「业务数据」在视觉上分层。
 * 深色主题下自动把主色翻成浅灰，避免按钮糊在背景里。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 设置中心专用主题
 */
export function buildSettingsNeutralTheme(token: GlobalToken): ThemeConfig {
  const dark = isDarkColor(token.colorBgContainer);
  const primary = dark ? NEUTRAL_PRIMARY_DARK : NEUTRAL_PRIMARY_LIGHT;

  return {
    token: {
      colorPrimary: primary,
      colorInfo: primary,
      colorLink: primary,
      colorLinkHover: token.colorTextSecondary,
      colorLinkActive: primary,
      // 顶栏图标（帮助、用户中心、pinned 插件）默认按深色顶栏取浅色，
      // 这里的顶栏是中性灰白，必须翻成正文色，否则整排图标白底白字看不见。
      colorTextHeaderMenu: token.colorText,
      colorTextHeaderMenuHover: token.colorText,
      colorTextHeaderMenuActive: token.colorText,
      colorBgHeaderMenuHover: token.colorFillQuaternary,
      colorBgHeaderMenuActive: token.colorFillQuaternary,
    } as ThemeConfig['token'],
    components: {
      Layout: {
        headerBg: token.colorBgContainer,
        headerColor: token.colorText,
        bodyBg: token.colorBgLayout,
      },
      Menu: {
        activeBarBorderWidth: 0,
        horizontalItemSelectedColor: token.colorText,
        horizontalItemHoverColor: token.colorText,
        itemSelectedBg: token.colorFillQuaternary,
        itemSelectedColor: token.colorText,
        itemHoverBg: token.colorFillQuaternary,
        itemHoverColor: token.colorText,
        subMenuItemBg: 'transparent',
      },
      Button: {
        primaryShadow: 'none',
      },
      Switch: {
        colorPrimary: primary,
      },
      Tabs: {
        inkBarColor: token.colorText,
        itemSelectedColor: token.colorText,
        itemHoverColor: token.colorText,
      },
    },
  };
}
