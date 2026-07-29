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
 * NocoBase 主题里跟顶栏有关的自定义 token。
 *
 * 这些不在 antd 的 `GlobalToken` 里，由主题编辑器写入，业务端顶栏也读同一套。
 */
type SettingsHeaderToken = GlobalToken & {
  colorBgHeader?: string;
  colorTextHeaderMenu?: string;
  colorTextHeaderMenuHover?: string;
  colorTextHeaderMenuActive?: string;
  colorBgHeaderMenuHover?: string;
  colorBgHeaderMenuActive?: string;
};

/**
 * 取顶栏配色。
 *
 * 设置中心顶栏跟随系统主题（含主题编辑器里改过的配色），与业务端顶栏保持一致，
 * 这样 logo、顶栏图标不需要各自再做一套反色处理。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns 顶栏底色、文字色、hover / active 色，以及顶栏是否为深色
 */
export function getSettingsHeaderColors(token: GlobalToken) {
  const headerToken = token as SettingsHeaderToken;
  const bg = headerToken.colorBgHeader || token.colorBgContainer;
  const dark = isDarkColor(bg);
  const fallbackText = dark ? 'rgba(255, 255, 255, 0.85)' : token.colorText;

  return {
    bg,
    dark,
    text: headerToken.colorTextHeaderMenu || fallbackText,
    textHover: headerToken.colorTextHeaderMenuHover || headerToken.colorTextHeaderMenu || fallbackText,
    textActive: headerToken.colorTextHeaderMenuActive || headerToken.colorTextHeaderMenu || fallbackText,
    bgHover: headerToken.colorBgHeaderMenuHover || (dark ? 'rgba(255, 255, 255, 0.12)' : token.colorFillQuaternary),
    bgActive: headerToken.colorBgHeaderMenuActive || (dark ? 'rgba(255, 255, 255, 0.16)' : token.colorFillQuaternary),
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
