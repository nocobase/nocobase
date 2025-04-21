/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AliasToken } from '../interface';
import type { TokenTree } from './interface';
import { seedRelatedAlias, seedRelatedMap } from './TokenRelation';

const category: TokenTree<keyof AliasToken | string> = [
  {
    name: '颜色',
    nameEn: 'Color',
    desc: '',
    descEn: '',
    groups: [
      {
        key: 'brandColor',
        type: 'Color',
        name: '品牌色',
        nameEn: 'Brand Color',
        desc: '品牌色是体现产品特性和传播理念最直观的视觉元素之一。在你完成品牌主色的选取之后，我们会自动帮你生成一套完整的色板，并赋予它们有效的设计语义。',
        descEn:
          'Brand color is one of the most direct visual elements to reflect the characteristics and communication of the product. After you have selected the brand color, we will automatically generate a complete color palette and assign it effective design semantics.',
        seedToken: ['colorPrimary'],
        mapToken: seedRelatedMap.colorPrimary,
        aliasToken: seedRelatedAlias.colorPrimary,
      },
      {
        key: 'successColor',
        type: 'Color',
        name: '成功色',
        nameEn: 'Success Color',
        desc: '用于表示操作成功的 Token 序列，如 Result、Progress 等组件会使用该组梯度变量。',
        descEn:
          'Used to represent the token sequence of operation success, such as Result, Progress and other components will use these map tokens.',
        seedToken: ['colorSuccess'],
        mapToken: seedRelatedMap.colorSuccess,
        aliasToken: seedRelatedAlias.colorSuccess,
      },
      {
        key: 'warningColor',
        type: 'Color',
        name: '警戒色',
        nameEn: 'Warning Color',
        desc: '用于表示操作警告的 Token 序列，如 Notification、 Alert等警告类组件或 Input 输入类等组件会使用该组梯度变量。',
        descEn:
          'Used to represent the warning map token, such as Notification, Alert, etc. Alert or Control component(like Input) will use these map tokens.',
        seedToken: ['colorWarning'],
        mapToken: seedRelatedMap.colorWarning,
        aliasToken: seedRelatedAlias.colorWarning,
      },
      {
        key: 'errorColor',
        type: 'Color',
        name: '错误色',
        nameEn: 'Error Color',
        desc: '用于表示操作失败的 Token 序列，如失败按钮、错误状态提示（Result）组件等。',
        descEn:
          'Used to represent the visual elements of the operation failure, such as the error Button, error Result component, etc.',
        seedToken: ['colorError'],
        mapToken: seedRelatedMap.colorError,
        aliasToken: seedRelatedAlias.colorError,
      },
      {
        key: 'infoColor',
        type: 'Color',
        name: '信息色',
        nameEn: 'Info Color',
        desc: '用于表示操作信息的 Token 序列，如 Alert 、Tag、 Progress 等组件都有用到该组梯度变量。',
        descEn:
          'Used to represent the operation information of the Token sequence, such as Alert, Tag, Progress, and other components use these map tokens.',
        seedToken: ['colorInfo'],
        mapToken: seedRelatedMap.colorInfo,
        aliasToken: seedRelatedAlias.colorInfo,
      },
      {
        key: 'neutralColor',
        type: 'Color',
        name: '中性色',
        nameEn: 'Neutral Color',
        desc: '中性色主要被大量的应用在界面的文字、背景、边框和填充的 4 种场景。合理地选择中性色能够令页面信息具备良好的主次关系，助力阅读体验。',
        descEn:
          'Neutral color is mainly applied to the four scenarios of text, background, border and fill in the interface. Reasonable selection of neutral colors can make the page information have a good primary and secondary relationship, and help the reading experience.',
        seedToken: ['colorTextBase', 'colorBgBase'],
        mapToken: seedRelatedMap.colorTextBase?.concat(seedRelatedMap.colorBgBase ?? []),
        aliasToken: seedRelatedAlias.colorTextBase?.concat(seedRelatedAlias.colorBgBase ?? []),
        aliasTokenDescription:
          '你可以利用 Alias Token 来精准控制部分组件的效果。例如 Input 、InputNumber、Select 等Control 类组件都共享了相同的 controlXX token 。只需修改值，即可实现不改变 Button 的情况下，修改 Control 类组件的效果。',
        mapTokenGroups: ['text', 'border', 'fill', 'background'],
      },
      {
        key: 'headerColor',
        type: 'Color',
        name: '导航色',
        nameEn: 'Header Color',
        desc: '只会影响页面顶部的导航栏',
        descEn: 'Only affects the navigation bar at the top of the page.',
        // seedToken: ['colorPrimaryHeader'],
        seedToken: [
          'colorBgHeader',
          'colorBgHeaderMenuHover',
          'colorBgHeaderMenuActive',
          'colorTextHeaderMenu',
          'colorTextHeaderMenuHover',
          'colorTextHeaderMenuActive',
        ],
        seedTokenAlpha: true,
      },
      {
        key: 'settingsColor',
        type: 'Color',
        name: 'UI 配置色',
        nameEn: 'UI Settings Color',
        desc: '用于更改 UI 配置组件的颜色',
        descEn: 'Used to change the color of the UI Settings component.',
        // seedToken: ['colorPrimarySettings'],
        seedToken: ['colorSettings'],
        seedTokenAlpha: true,
        mapToken: ['colorBgSettingsHover', 'colorTemplateBgSettingsHover', 'colorBorderSettingsHover'],
      },
    ],
  },
  {
    name: '尺寸',
    nameEn: 'Size',
    desc: '',
    descEn: '',
    groups: [
      {
        key: 'font',
        name: '文字',
        nameEn: 'Font',
        desc: '',
        descEn: '',
        seedToken: ['fontSize'],
        groups: [
          {
            key: 'fontSize',
            type: 'FontSize',
            name: '字号',
            nameEn: 'Font Size',
            desc: '',
            descEn: '',
            mapToken: [
              'fontSize',
              'fontSizeSM',
              'fontSizeLG',
              'fontSizeXL',
              'fontSizeHeading1',
              'fontSizeHeading2',
              'fontSizeHeading3',
              'fontSizeHeading4',
              'fontSizeHeading5',
            ],
            aliasToken: ['fontSizeIcon'],
          },
          {
            key: 'lineHeight',
            type: 'LineHeight',
            name: '行高',
            nameEn: 'Line Height',
            desc: '',
            descEn: '',
            mapToken: [
              'lineHeight',
              'lineHeightSM',
              'lineHeightLG',
              'lineHeightHeading1',
              'lineHeightHeading2',
              'lineHeightHeading3',
              'lineHeightHeading4',
              'lineHeightHeading5',
            ],
          },
        ],
      },
      {
        key: 'spacing',
        name: '间距',
        nameEn: 'Spacing',
        desc: '',
        descEn: '',
        seedToken: ['sizeStep', 'sizeUnit'],
        groups: [
          {
            key: 'margin',
            type: 'Margin',
            name: '外间距',
            nameEn: 'Margin',
            desc: '',
            descEn: '',
            mapToken: [
              'marginXXS',
              'marginXS',
              'marginSM',
              'margin',
              'marginMD',
              'marginLG',
              'marginXL',
              'marginXXL',
              'marginBlock',
            ],
          },
          {
            key: 'padding',
            type: 'Padding',
            name: '内间距',
            nameEn: 'Padding',
            desc: '',
            descEn: '',
            mapToken: [
              'paddingXXS',
              'paddingXS',
              'paddingSM',
              'padding',
              'paddingMD',
              'paddingLG',
              'paddingXL',
              'paddingPageHorizontal',
              'paddingPageVertical',
              'paddingPopupHorizontal',
              'paddingPopupVertical',
            ],
            aliasToken: [
              'paddingContentHorizontal',
              'paddingContentVertical',
              'paddingContentHorizontalSM',
              'paddingContentVerticalSM',
              'paddingContentHorizontalLG',
              'paddingContentVerticalLG',
            ],
          },
        ],
      },
    ],
  },
  {
    name: '风格',
    nameEn: 'Style',
    desc: '',
    descEn: '',
    groups: [
      {
        key: 'borderRadius',
        type: 'BorderRadius',
        name: '圆角',
        nameEn: 'Border Radius',
        desc: '',
        descEn: '',
        seedToken: ['borderRadius'],
        mapToken: ['borderRadius', 'borderRadiusSM', 'borderRadiusLG', 'borderRadiusXS', 'borderRadiusBlock'],
      },
      {
        key: 'boxShadow',
        type: 'BoxShadow',
        name: '阴影',
        nameEn: 'Shadow',
        desc: '',
        descEn: '',
        mapToken: ['boxShadow', 'boxShadowSecondary'],
      },
    ],
  },
  {
    name: '其他',
    nameEn: 'Others',
    desc: '',
    descEn: '',
    groups: [
      {
        key: 'other',
        type: 'other',
        name: '其他',
        nameEn: 'Others',
        desc: '',
        descEn: '',
        seedToken: ['wireframe', 'siderWidth'],
      },
    ],
  },
];

export default category;
