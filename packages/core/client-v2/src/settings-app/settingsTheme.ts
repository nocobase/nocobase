/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GlobalToken, ThemeConfig } from 'antd';

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
 * 顶栏自己是透明底（底色由 Layout.Header 给），下拉浮层跟着顶栏用容器色；
 * 选中 / hover 的颜色一律交给外层主题，也就是默认蓝。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 顶栏菜单主题
 */
export function buildSettingsHeaderMenuTheme(token: GlobalToken): ThemeConfig {
  const colors = getSettingsHeaderColors(token);

  return {
    components: {
      Menu: {
        itemBg: 'transparent',
        popupBg: colors.bg,
        subMenuItemBg: 'transparent',
        // 顶栏表达的是「在哪个模块」，属于背景信息：选中态用一条下划线 + 加粗就够，
        // 实心色块太重，会跟左栏那个「当前页面」的强指示打架。
        // 未选中项也用正文色——次要灰在白底顶栏上偏淡，看不清；选中态靠下划线 + 加粗区分。
        itemColor: token.colorText,
        itemHoverColor: token.colorText,
        horizontalItemSelectedColor: token.colorText,
        horizontalItemSelectedBg: 'transparent',
        horizontalItemHoverColor: token.colorText,
        horizontalItemBorderRadius: 0,
      },
    },
  };
}

/**
 * 构造设置中心的外壳主题。
 *
 * 只做**顶栏**这一层：白（或深色主题下的容器色）底 + 细分割线，文字与图标走正文色，
 * 和业务端那条深色顶栏区分开。
 *
 * 选中态一律用浅灰底 + 正文色，只有开关这类「开/关」控件才用纯黑填充。
 * 各插件页面里 `controlItemBgActive` 常被当成纯背景用、文字色不跟着走，所以那个 token
 * 也保持浅色，不然列表行会变成深底深字。
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 设置中心外壳主题
 */
export function buildSettingsNeutralTheme(token: GlobalToken): ThemeConfig {
  const headerColors = getSettingsHeaderColors(token);
  const dark = headerColors.dark;
  /** 选中态底色：浅色主题下是黑，深色主题下翻成白 */
  const activeBg = dark ? '#ffffff' : '#000000';
  const activeText = dark ? '#000000' : '#ffffff';

  return {
    token: {
      // 顶栏图标（帮助、用户中心、pinned 插件）默认按深色顶栏取浅色；
      // 这里的顶栏是灰白的，必须翻成正文色，否则整排图标白底白字看不见。
      colorTextHeaderMenu: headerColors.text,
      colorTextHeaderMenuHover: headerColors.textHover,
      colorTextHeaderMenuActive: headerColors.textActive,
      colorBgHeaderMenuHover: headerColors.bgHover,
      colorBgHeaderMenuActive: headerColors.bgActive,
      // 主色收成黑白。antd 会拿它派生一整套色板，而近黑色派生出来的「浅色背景」是 #5e5e5e
      // 这种中灰，列表行、Select 选项选中后就成了深底深字，所以派生的那几个必须显式钉住。
      colorPrimary: activeBg,
      colorInfo: activeBg,
      colorPrimaryHover: dark ? '#ffffff' : '#333333',
      colorPrimaryActive: dark ? '#d4d4d4' : '#000000',
      colorPrimaryBg: token.colorFillQuaternary,
      colorPrimaryBgHover: token.colorFillTertiary,
      colorPrimaryBorder: token.colorBorder,
      colorPrimaryBorderHover: token.colorTextTertiary,
      // 提示类（Alert / Tag 的 info 态）同理：主色一黑，派生的底色就成了脏灰配黑字。
      colorInfoBg: token.colorFillQuaternary,
      colorInfoBgHover: token.colorFillTertiary,
      colorInfoBorder: token.colorBorderSecondary,
      colorInfoBorderHover: token.colorBorder,
      colorInfoText: token.colorText,
      controlItemBgActive: token.colorFillQuaternary,
      controlItemBgActiveHover: token.colorFillTertiary,
      // 压在主色上的文字：浅色主题下主色是黑，文字白；深色主题反过来。
      colorTextLightSolid: activeText,
      // 链接：灰色 + 下划线（下划线在 settingsGlobalCss 里补，token 层没有这一项）
      colorLink: token.colorTextSecondary,
      colorLinkHover: token.colorText,
      colorLinkActive: token.colorText,
      // 自绘选中态（列表行、树节点）读这一对，见 CustomToken 里的说明。
      // 这里用浅底：整行纯黑太重，行内的图标、标签都得跟着反色，得不偿失。
      // 文字色留空表示「不覆盖」，各页面保持正文色即可。
      colorBgItemActive: token.colorFillSecondary,
      colorTextItemActive: '',
    } as ThemeConfig['token'],
    components: {
      Layout: {
        headerBg: headerColors.bg,
        headerColor: headerColors.text,
        bodyBg: token.colorBgLayout,
      },
      Menu: {
        // 左栏选中态：浅底 + 加粗，不再画左侧竖线。
        itemSelectedBg: token.colorFillSecondary,
        itemSelectedColor: token.colorText,
        // 子菜单容器保留一层很淡的底色标记「这是一组」，但要比选中项浅一档，
        // 否则两层灰叠在一起就分不出哪个是选中的。
        subMenuItemBg: token.colorFillQuaternary,
        subMenuItemSelectedColor: token.colorText,
        horizontalItemSelectedColor: token.colorText,
        horizontalItemSelectedBg: 'transparent',
        activeBarBorderWidth: 0,
      },
      Spin: {
        // 加载态跟着中性配色走，别在一片黑白灰里闪一个蓝点。
        colorPrimary: token.colorTextTertiary,
      },
      Select: {
        // 下拉选中项用浅灰底 + 正文色，别在下拉里压一条纯黑。
        optionSelectedBg: token.colorFillSecondary,
        optionSelectedColor: token.colorText,
      },
      Switch: {
        colorPrimary: activeBg,
        colorPrimaryHover: activeBg,
      },
      Tabs: {
        // 页签选中态跟着黑白走，不然一页里既有黑色选中项又有蓝色页签。
        itemSelectedColor: token.colorText,
        itemHoverColor: token.colorText,
        itemActiveColor: token.colorText,
        inkBarColor: token.colorText,
      },
    },
  };
}

/**
 * 给外部主题补上设置中心的顶栏配色。
 *
 * 顶栏那几个 token（`colorBgHeader`、`colorTextHeaderMenu` 系列、`Layout.headerBg`）
 * 刻意不放进「简约」主题记录里：那条记录是通用的，业务端顶栏是深色的、logo 和图标都按
 * 深底做的，一旦被改成白底就得连 logo 一起反色。设置中心的顶栏是白的，所以在这一层补。
 *
 * @param {ThemeConfig} theme 主题记录里读到的配置
 * @param {GlobalToken} token 外层主题 token
 * @returns {ThemeConfig} 补齐顶栏配色后的主题
 */
export function withSettingsHeaderTheme(theme: ThemeConfig, token: GlobalToken): ThemeConfig {
  const colors = getSettingsHeaderColors(token);

  return {
    ...theme,
    token: {
      ...theme.token,
      colorTextHeaderMenu: colors.text,
      colorTextHeaderMenuHover: colors.textHover,
      colorTextHeaderMenuActive: colors.textActive,
      colorBgHeaderMenuHover: colors.bgHover,
      colorBgHeaderMenuActive: colors.bgActive,
    } as ThemeConfig['token'],
    components: {
      ...theme.components,
      Layout: {
        ...theme.components?.Layout,
        headerBg: colors.bg,
        headerColor: colors.text,
        bodyBg: token.colorBgLayout,
      },
    },
  };
}

/**
 * Height of one entry in the top bar dropdown.
 *
 * Taken from the user center dropdown (`nb-user-center-item`, 30px) so that the
 * two dropdowns hanging off the same top bar line up.
 */
const SETTINGS_MENU_ITEM_HEIGHT = 30;

/**
 * 设置中心的全局补丁样式。
 *
 * 这几件事 antd 没给 token，只能落到 CSS：
 * - 裸 `<a>` 的颜色。它吃的是**最外层** ConfigProvider 生成的全局 reset 样式，
 *   我们这层嵌套 ConfigProvider 的 `colorLink` 够不着，只能在 CSS 里压一次。
 * - 链接下划线（`colorLink` 只管颜色）
 * - Switch 禁用态压得更淡，跟「未启用但可点」区分开
 * - 顶栏选中项的下划线、左栏选中项的加粗
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {string} 可直接塞进 `<style>` 的 CSS
 */
export function buildSettingsGlobalCss(token: GlobalToken): string {
  return `
/* The rules below deliberately drop the .nb-settings-shell prefix: antd renders
   drawers, modals and dropdowns into portals under body, where a shell-scoped
   selector never matches — that is how the edit link inside the collection drawer
   kept antd's default blue. This stylesheet is only injected by the standalone
   settings SPA, so unscoped selectors cannot reach the business side. */

/* 最外层 body 的底色来自业务端主题（暗黑下是 #141414）。内容区一般把它整块盖住，
   但内容不满屏、或者滚动橡皮筋回弹时会漏出来，所以这里一并接管。
   设置中心是独立入口的单页应用，这条全局规则不会影响业务端。 */
body {
  background: ${token.colorBgLayout};
}
a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn):not([class*="ant-"]) {
  color: ${token.colorTextSecondary};
}
a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn):not([class*="ant-"]):hover {
  color: ${token.colorText};
}
a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn),
.ant-btn-link:not(:disabled) {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.nb-settings-shell .ant-layout-header .ant-menu-horizontal > .ant-menu-item::after,
.nb-settings-shell .ant-layout-header .ant-menu-horizontal > .ant-menu-submenu::after {
  border-bottom: none !important;
}
.nb-settings-shell .ant-layout-header .ant-menu-horizontal > .ant-menu-item-selected,
.nb-settings-shell .ant-layout-header .ant-menu-horizontal > .ant-menu-submenu-selected {
  font-weight: 600;
  box-shadow: inset 0 -2px 0 0 ${token.colorText};
}
.nb-settings-shell .ant-layout-sider .ant-menu-item-selected {
  font-weight: 600;
}
.nb-settings-shell .ant-layout-sider .ant-menu-item::after,
.nb-settings-shell .ant-layout-sider .ant-menu-submenu-title::after {
  display: none !important;
}
/* Entry height matches the other dropdown on the same top bar (the user center,
   whose nb-user-center-item is 30px). antd sizes menu entries with
   controlHeightLG (35px under compact), which is the height of a single clickable
   control; this dropdown is a list of a dozen links and reads loose at 35.

   Scoped to entries inside the popup only: the horizontal top bar menu shares the
   same Menu tokens, so changing tokens would eat its horizontal padding too. The
   selector needs three classes; two do not outweigh antd's own rule. */
.ant-menu-submenu-popup .ant-menu.ant-menu-sub.ant-menu-vertical {
  /* With the 4px margin between entries gone, the first and last would sit flush
     against the popup edge, so the container gives the padding back. */
  padding-block: ${token.paddingXXS}px;
}
.ant-menu-submenu-popup .ant-menu-sub > .ant-menu-item,
.ant-menu-submenu-popup .ant-menu-sub > .ant-menu-submenu > .ant-menu-submenu-title {
  height: ${SETTINGS_MENU_ITEM_HEIGHT}px;
  line-height: ${SETTINGS_MENU_ITEM_HEIGHT}px;
  margin-block: 0;
}

/* Info alerts: with the primary color collapsed to black and white, their derived
   background lands on rgba(0,0,0,0.02) — faint enough to read as empty space.
   Rather than reaching for color (which would drag the palette back in), the shape
   carries the weight: a 4px bar on the left, a firmer background and border, a
   bold title and a larger icon. Warning / error / success keep their semantic
   colors and are left alone. */
.ant-alert-info {
  background: ${token.colorFillSecondary};
  border: ${token.lineWidth}px solid ${token.colorBorder};
  border-inline-start: 4px solid ${token.colorText};
  padding-block: ${token.paddingSM}px;
}
.ant-alert-info .ant-alert-icon,
.ant-alert-info .ant-alert-message {
  color: ${token.colorText};
}
.ant-alert-info .ant-alert-icon {
  font-size: ${token.fontSizeLG}px;
}
.ant-alert-info .ant-alert-message {
  font-weight: 600;
}
.ant-alert-info .ant-alert-description {
  color: ${token.colorTextSecondary};
}
/* Three switch shades: off is light grey (colorFill, 0.15), disabled is dark grey
   (colorTextTertiary, 0.45), on is black. Disabled being darker than off is
   deliberate — here "darker" reads as "pinned", not "stronger" — and one light
   against one dark is told apart at a glance, without comparing subtle
   brightness steps. Disabled is not dimmed as a whole: the plugin manager shows
   over a hundred built-in plugins in that state, and dimming makes the page look
   broken. */
.ant-switch {
  background: ${token.colorFill};
}
.ant-switch.ant-switch-checked {
  background: ${token.colorText};
}
/* This selector has to outweigh antd's own .ant-switch.ant-switch-disabled (a
   single class no longer does, now that the shell prefix is gone), otherwise its
   opacity: 0.65 survives and washes the dark grey out onto the off state, where
   the two read as the same color. */
.ant-switch.ant-switch-disabled,
.ant-switch.ant-switch-disabled.ant-switch-checked {
  background: ${token.colorTextTertiary};
  opacity: 1;
}
`;
}
