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
 * 选中态做成黑底白字：只改 antd **成对提供了背景和文字 token** 的组件（菜单、Select 选项）。
 * 各插件页面里 `controlItemBgActive` 常被当成纯背景用、文字色不跟着走，所以那个 token
 * 仍保持浅色，不然列表行会变成黑底黑字。
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
        // 左栏选中态用一条竖线 + 浅底（竖线在 settingsGlobalCss 里画），
        // 和顶栏的下划线是同一套语言：用「边」标记位置，而不是拿实心块压住整行。
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
        optionSelectedBg: activeBg,
        optionSelectedColor: activeText,
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
 * 设置中心的全局补丁样式。
 *
 * 这几件事 antd 没给 token，只能落到 CSS：
 * - 裸 `<a>` 的颜色。它吃的是**最外层** ConfigProvider 生成的全局 reset 样式，
 *   我们这层嵌套 ConfigProvider 的 `colorLink` 够不着，只能在 CSS 里压一次。
 * - 链接下划线（`colorLink` 只管颜色）
 * - Switch 未激活时给纯白底 + 描边，而不是默认的灰色滑轨
 * - 顶栏选中项做成带圆角的色块，而不是顶天立地的直角方块
 *
 * @param {GlobalToken} token 外层主题 token
 * @returns {string} 可直接塞进 `<style>` 的 CSS
 */
export function buildSettingsGlobalCss(token: GlobalToken): string {
  const dark = isDarkColor(token.colorBgContainer);
  const offBg = dark ? token.colorBgContainer : '#ffffff';

  return `
.nb-settings-shell a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn):not([class*="ant-"]) {
  color: ${token.colorTextSecondary};
}
.nb-settings-shell a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn):not([class*="ant-"]):hover {
  color: ${token.colorText};
}
.nb-settings-shell a:not(.ant-btn):not(.ant-menu-item):not(.ant-tabs-tab-btn),
.nb-settings-shell .ant-btn-link:not(:disabled) {
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
  box-shadow: inset 3px 0 0 0 ${token.colorText};
}
.nb-settings-shell .ant-layout-sider .ant-menu-item::after,
.nb-settings-shell .ant-layout-sider .ant-menu-submenu-title::after {
  display: none !important;
}
.nb-settings-shell .ant-switch:not(.ant-switch-checked) {
  background: ${offBg};
  /* 用内阴影而不是 border 描边：border 会占掉 1px，滑块位置跟着偏，一排开关就对不齐了 */
  box-shadow: inset 0 0 0 ${token.lineWidth}px ${token.colorBorder};
}
.nb-settings-shell .ant-switch:not(.ant-switch-checked) .ant-switch-handle::before {
  background: ${token.colorTextTertiary};
}
`;
}
