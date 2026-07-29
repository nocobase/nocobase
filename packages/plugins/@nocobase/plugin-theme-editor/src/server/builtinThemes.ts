/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ThemeItem } from '../types';

/** antd 默认主题 */
export const defaultTheme: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Default',
  },
  optional: true,
  isBuiltIn: true,
  uid: 'default',
  default: process.env.__E2E__ ? true : false,
};

export const dark: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Dark',
    // @ts-ignore
    algorithm: 'darkAlgorithm',
  },
  optional: true,
  isBuiltIn: true,
  uid: 'dark',
  default: false,
};

export const compact: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Compact',
    // @ts-ignore
    algorithm: 'compactAlgorithm',
    token: {
      fontSize: 16,
    },
  },
  optional: true,
  isBuiltIn: true,
  uid: 'compact',
  default: process.env.__E2E__ ? false : true,
};

/**
 * 简约主题：黑白灰、无强调色。
 *
 * 设置中心的外观由这条记录约束，不再写死在代码里：想调就在主题编辑器里改它，
 * 删掉则回落到代码里的默认中性配色。
 *
 * `optional: false`：默认不进用户的主题下拉框。它是给设置中心这个作用域用的，
 * 不是谁的业务端个人偏好；需要给别的应用复用时，在主题编辑器里把「可被用户选择」
 * 打开即可，记录本身是通用的。
 *
 * 主色收成黑白后 antd 会派生出一整套中灰色板（近黑主色派生的「浅色背景」是 #5e5e5e 这种
 * 中灰，会造成深底深字），所以派生出来的那几个必须显式钉住，取值就是 antd 默认的中性填充色。
 */
export const minimal: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Minimal',
    // 间距和字号跟「紧凑」一致：这条主题是整套替换而不是叠加，不带算法的话
    // 会退回 antd 默认的宽松间距，跟平台其他地方对不上。
    // @ts-ignore
    algorithm: 'compactAlgorithm',
    token: {
      fontSize: 16,
      // 顶栏那几个 token（colorBgHeader / colorTextHeaderMenu…）刻意不进这条主题：
      // 业务端顶栏是深色的，logo 和图标都按深底做的，翻成白底就得连 logo 一起反色。
      // 设置中心自己那条白顶栏由 settingsTheme 在代码里补，不牵连用这套主题的其他应用。
      colorPrimary: '#000000',
      colorInfo: '#000000',
      colorPrimaryHover: '#333333',
      colorPrimaryActive: '#000000',
      colorPrimaryBg: 'rgba(0, 0, 0, 0.02)',
      colorPrimaryBgHover: 'rgba(0, 0, 0, 0.04)',
      colorPrimaryBorder: '#d9d9d9',
      colorPrimaryBorderHover: 'rgba(0, 0, 0, 0.45)',
      colorInfoBg: 'rgba(0, 0, 0, 0.02)',
      colorInfoBgHover: 'rgba(0, 0, 0, 0.04)',
      colorInfoBorder: '#f0f0f0',
      colorInfoBorderHover: '#d9d9d9',
      colorInfoText: 'rgba(0, 0, 0, 0.88)',
      controlItemBgActive: 'rgba(0, 0, 0, 0.02)',
      controlItemBgActiveHover: 'rgba(0, 0, 0, 0.04)',
      colorTextLightSolid: '#ffffff',
      colorLink: 'rgba(0, 0, 0, 0.65)',
      colorLinkHover: 'rgba(0, 0, 0, 0.88)',
      colorLinkActive: 'rgba(0, 0, 0, 0.88)',
      // 自绘选中态（角色列表、部门树）读这一对；整行纯黑太重，用浅底 + 正文色。
      colorBgItemActive: 'rgba(0, 0, 0, 0.06)',
      colorTextItemActive: '',
    },
    components: {
      Menu: {
        itemSelectedBg: 'rgba(0, 0, 0, 0.06)',
        itemSelectedColor: 'rgba(0, 0, 0, 0.88)',
        subMenuItemBg: 'rgba(0, 0, 0, 0.02)',
        subMenuItemSelectedColor: 'rgba(0, 0, 0, 0.88)',
        horizontalItemSelectedColor: 'rgba(0, 0, 0, 0.88)',
        horizontalItemSelectedBg: 'transparent',
        activeBarBorderWidth: 0,
      },
      Spin: {
        colorPrimary: 'rgba(0, 0, 0, 0.45)',
      },
      Select: {
        optionSelectedBg: '#000000',
        optionSelectedColor: '#ffffff',
      },
      Switch: {
        colorPrimary: '#000000',
        colorPrimaryHover: '#000000',
      },
      Tabs: {
        itemSelectedColor: 'rgba(0, 0, 0, 0.88)',
        itemHoverColor: 'rgba(0, 0, 0, 0.88)',
        itemActiveColor: 'rgba(0, 0, 0, 0.88)',
        inkBarColor: 'rgba(0, 0, 0, 0.88)',
      },
    },
  } as ThemeItem['config'],
  optional: false,
  isBuiltIn: true,
  uid: 'minimal',
  default: false,
};

/** 同时包含 `紧凑` 和 `暗黑` 两种模式 */
export const compactDark: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Compact dark',
    // @ts-ignore
    algorithm: ['compactAlgorithm', 'darkAlgorithm'],
    token: {
      fontSize: 16,
      colorBgHeader: '#000000',
      colorPrimaryHeader: '#000000',
    },
  },
  optional: true,
  isBuiltIn: true,
  uid: 'compact_dark',
  default: false,
};
