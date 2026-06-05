/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const screenSizeTitleMaps = {
  xs: 'Phone device',
  md: 'Tablet device',
  lg: 'Desktop device',
  xxl: 'Large screen device',
};

export const gridSizes = ['xs', 'md', 'lg', 'xxl'];

export const columnCountMarks = [1, 2, 3, 4, 6, 8, 12, 24].reduce((obj, cur) => {
  obj[cur] = cur;
  return obj;
}, {});

export const screenSizeMaps = {
  xs: '< 768',
  md: '≥ 768',
  lg: '≥ 992',
  xxl: '≥ 1600',
};
