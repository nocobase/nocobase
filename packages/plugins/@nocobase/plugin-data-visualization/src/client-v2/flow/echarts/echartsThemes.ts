/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as echarts from 'echarts';

/**
 * echarts 没有内建具名主题（'dark' / 'vintage' / 'macarons' 都不是内建名）。
 * 想用 `echarts.init(el, name)` 就必须先 `echarts.registerTheme(name, {...})`，
 * 否则 echarts 静默回退到默认浅色。这里集中注册一组可在 settings 页选择的主题。
 *
 * 模块级只执行一次；被 useEChartsGlobalConfig 和 settings 页共同引用，避免重复注册。
 */

let registered = false;

export const ECHARTS_DARK_THEME = 'nocobase-dark';

export function ensureEChartsThemesRegistered(): void {
  if (registered) {
    return;
  }
  registered = true;

  echarts.registerTheme(ECHARTS_DARK_THEME, {
    backgroundColor: 'transparent',
    textStyle: { color: '#d0d0d0' },
    title: { textStyle: { color: '#d0d0d0' } },
    legend: { textStyle: { color: '#d0d0d0' } },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderColor: '#555',
      textStyle: { color: '#fff' },
    },
  });

  echarts.registerTheme('vintage', {
    color: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63'],
    backgroundColor: 'transparent',
    textStyle: { color: '#333' },
  });

  echarts.registerTheme('macarons', {
    color: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552'],
    backgroundColor: 'transparent',
    textStyle: { color: '#333' },
  });
}

/**
 * settings 页下拉可选的主题。`value: ''` 表示 echarts 默认浅色（不指定主题）。
 * label 用 i18n key（在 settings 页用 t() 翻译）。
 */
export const ECHARTS_THEME_OPTIONS: { label: string; value: string }[] = [
  { label: 'Default (light)', value: '' },
  { label: 'Dark', value: ECHARTS_DARK_THEME },
  { label: 'Vintage', value: 'vintage' },
  { label: 'Macarons', value: 'macarons' },
];
