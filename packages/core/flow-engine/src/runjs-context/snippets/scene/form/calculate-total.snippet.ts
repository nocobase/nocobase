/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSItemRunJSContext } from '../../../contexts/JSItemRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSItemRunJSContext],
  prefix: 'sn-link-calc',
  label: 'Calculate total price (quantity × price)',
  description: 'Automatically calculate total when quantity or unit price changes',
  locales: {
    'zh-CN': {
      label: '计算总价（数量 × 单价）',
      description: '当数量或单价变化时自动计算总价',
    },
  },
  content: `
// Get quantity and unit price from current record
const quantity = Number(ctx.record?.quantity) || 0;
const unitPrice = Number(ctx.record?.unitPrice) || 0;
const total = quantity * unitPrice;

// Find and update the 'totalPrice' field
const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

const totalField = candidates.find((item) => item?.props?.name === 'totalPrice');

if (totalField) {
  totalField.setProps({ value: total.toFixed(2) });
} else {
  console.warn('[Form snippet] totalPrice field not found');
}
`,
};

export default snippet;
