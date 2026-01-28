/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSFieldRunJSContext } from '../../../contexts/JSFieldRunJSContext';
import { FormJSFieldItemRunJSContext } from '../../../contexts/FormJSFieldItemRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSFieldRunJSContext, FormJSFieldItemRunJSContext],
  prefix: 'sn-jsf-color',
  label: 'Display number field as colored text',
  description: 'Display numeric values using colors based on their sign',
  locales: {
    'zh-CN': {
      label: '将数字字段显示为彩色文本',
      description: '根据数值正负设置显示颜色',
    },
  },
  content: `
// Colorize based on numeric sign
const n = Number(ctx.value ?? 0);
const color = Number.isFinite(n) ? (n > 0 ? 'green' : n < 0 ? 'red' : '#999') : '#555';
ctx.render('<span style=' + JSON.stringify('color:' + color) + '>' + String(ctx.value ?? '') + '</span>');
`,
};

export default snippet;
