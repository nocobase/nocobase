/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ThemeConfig } from './type';

const defaultTheme: ThemeConfig = {
  name: '',
  token: {
    // 顶部导航栏
    colorPrimaryHeader: '#001529',
    colorBgHeader: '#001529',
    colorBgHeaderMenuHover: '#ffffff1a',
    colorBgHeaderMenuActive: '#ffffff1a',
    colorTextHeaderMenu: '#ffffffa6',
    colorTextHeaderMenuHover: '#ffffff',
    colorTextHeaderMenuActive: '#ffffff',

    // UI 配置组件
    colorSettings: '#F18B62',
    colorBgSettingsHover: 'rgba(241, 139, 98, 0.06)',
    colorTemplateBgSettingsHover: 'rgba(98, 200, 241, 0.06)', // 默认为colorBgSettingsHover的互补色
    colorBorderSettingsHover: 'rgba(241, 139, 98, 0.3)',

    // 动画相关
    motionUnit: 0.03,
    // ant design 升级到5.24.2后，Modal.confirm在E2E中如果关闭动画，会出现ant-modal-mask不销毁的问题
    // motion: !process.env.__E2E__,
  },
};

export default defaultTheme;
