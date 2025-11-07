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
  prefix: 'sn-link-copy',
  label: 'Copy value from another field',
  description: 'Copy value from one field to another when checkbox is checked',
  locales: {
    'zh-CN': {
      label: '复制字段值',
      description: '勾选复选框时，将一个字段的值复制到另一个字段',
    },
  },
  content: `
// When 'sameAsAbove' is checked, copy billing address to shipping address
const sameAsAbove = ctx.record?.sameAsAbove;

if (!sameAsAbove) {
  return;
}

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

// Source and target field mappings
const fieldMappings = [
  { from: 'billingAddress', to: 'shippingAddress' },
  { from: 'billingCity', to: 'shippingCity' },
  { from: 'billingZipCode', to: 'shippingZipCode' },
];

fieldMappings.forEach(({ from, to }) => {
  const sourceValue = ctx.record?.[from];
  const targetField = candidates.find((item) => item?.props?.name === to);

  if (targetField) {
    targetField.setProps({ value: sourceValue });
  }
});

ctx.message?.success?.(ctx.t('Address copied successfully'));
`,
};

export default snippet;
