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
  prefix: 'sn-jsf-num',
  label: 'Display number field as localized number',
  description: 'Format numeric values with locale-aware separators before rendering',
  locales: {
    'zh-CN': {
      label: '将数字字段显示为本地化格式',
      description: '按本地化格式输出数值',
    },
  },
  content: `
// Format number using locale
const n = Number(ctx.value ?? 0);
ctx.render(String(Number.isFinite(n) ? n.toLocaleString() : ctx.value ?? ''));
`,
};

export default snippet;
