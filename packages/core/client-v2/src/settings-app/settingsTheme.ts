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
 * 取顶栏配色。
 *
 * 设置中心的顶栏刻意**不跟随**主题编辑器里的 `colorBgHeader`：那套深色顶栏是给业务端的，
 * 设置中心用容器底色（浅色主题下就是白色）+ 一条细分割线，和业务端在视觉上分开。
 * 文字和图标一律走正文色，深色主题下由 `colorBgContainer` 自动翻成浅色。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns 顶栏底色、文字色、hover / active 色，以及顶栏是否为深色
 */
export function getSettingsHeaderColors(token: GlobalToken) {
  const bg = token.colorBgContainer;

  return {
    bg,
    dark: isDarkColor(bg),
    text: token.colorText,
    textHover: token.colorText,
    textActive: token.colorText,
    bgHover: token.colorFillQuaternary,
    bgActive: token.colorFillQuaternary,
  };
}

/**
 * 顶栏一级导航专用主题。
 *
 * 顶栏底色由主题决定，可能是深色也可能是浅色，因此菜单文字必须走 `colorTextHeaderMenu`
 * 这一族 token，而不是正文色；左侧栏的 inline 菜单不受影响，仍用外层的中性配置。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 顶栏菜单主题
 */
export function buildSettingsHeaderMenuTheme(token: GlobalToken): ThemeConfig {
  const colors = getSettingsHeaderColors(token);

  return {
    components: {
      Menu: {
        activeBarBorderWidth: 0,
        itemBg: 'transparent',
        itemColor: colors.text,
        itemHoverColor: colors.textHover,
        itemHoverBg: colors.bgHover,
        itemSelectedColor: colors.textActive,
        itemSelectedBg: colors.bgActive,
        horizontalItemHoverColor: colors.textHover,
        horizontalItemSelectedColor: colors.textActive,
        horizontalItemSelectedBg: colors.bgActive,
        popupBg: colors.bg,
        subMenuItemBg: 'transparent',
      },
    },
  };
}

/**
 * 构造设置中心的中性灰白主题。
 *
 * 内容区刻意不跟业务端抢彩色：主色收敛成中性深灰，让「配置」和「业务数据」在视觉上分层；
 * 顶栏则完全跟随系统主题，不做单独配色。深色主题下把主色翻成浅灰并同步反转其上的文字色，
 * 避免主按钮糊在背景里。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 设置中心专用主题
 */
export function buildSettingsNeutralTheme(token: GlobalToken): ThemeConfig {
  const dark = isDarkColor(token.colorBgContainer);
  const primary = dark ? NEUTRAL_PRIMARY_DARK : NEUTRAL_PRIMARY_LIGHT;
  const headerColors = getSettingsHeaderColors(token);

  return {
    token: {
      colorPrimary: primary,
      colorInfo: primary,
      colorLink: primary,
      colorLinkHover: token.colorTextSecondary,
      colorLinkActive: primary,
      // 主色是中性灰：深色主题下它是浅灰，压在其上的文字必须反成深色，否则主按钮白字白底。
      colorTextLightSolid: dark ? NEUTRAL_PRIMARY_LIGHT : '#ffffff',
      // 顶栏图标（帮助、用户中心、pinned 插件）默认按深色顶栏取浅色；
      // 这里的顶栏是灰白的，必须翻成正文色，否则整排图标白底白字看不见。
      colorTextHeaderMenu: headerColors.text,
      colorTextHeaderMenuHover: headerColors.textHover,
      colorTextHeaderMenuActive: headerColors.textActive,
      colorBgHeaderMenuHover: headerColors.bgHover,
      colorBgHeaderMenuActive: headerColors.bgActive,
    } as ThemeConfig['token'],
    components: {
      Layout: {
        headerBg: headerColors.bg,
        headerColor: headerColors.text,
        bodyBg: token.colorBgLayout,
      },
      Menu: {
        activeBarBorderWidth: 0,
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
