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
  prefix: 'sn-link-show-hide',
  label: 'Show/hide fields based on condition',
  description: 'Toggle multiple fields visibility based on a condition',
  locales: {
    'zh-CN': {
      label: '条件显示/隐藏字段',
      description: '根据条件批量显示或隐藏多个字段',
    },
  },
  content: `
// Show payment fields only when paymentMethod is 'online'
const paymentMethod = ctx.record?.paymentMethod;
const showPaymentFields = paymentMethod === 'online';

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

// Fields to toggle
const fieldNames = ['creditCard', 'expiryDate', 'cvv'];

fieldNames.forEach((fieldName) => {
  const field = candidates.find((item) => item?.props?.name === fieldName);
  if (field) {
    field.setProps({
      display: showPaymentFields ? 'visible' : 'hidden',
      // Also clear values when hiding
      value: showPaymentFields ? field.props.value : undefined,
    });
  }
});
`,
};

export default snippet;
