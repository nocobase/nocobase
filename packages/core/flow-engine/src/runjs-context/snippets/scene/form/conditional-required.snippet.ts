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
  prefix: 'sn-link-require',
  label: 'Conditional required field',
  description: "Make a field required based on another field's value",
  locales: {
    'zh-CN': {
      label: '条件必填',
      description: '根据另一个字段的值动态设置必填状态',
    },
  },
  content: `
// When 'needsApproval' is true, make 'approver' field required
const needsApproval = ctx.record?.needsApproval;

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

const approverField = candidates.find((item) => item?.props?.name === 'approver');

if (approverField) {
  approverField.setProps({
    required: !!needsApproval,
    // Also toggle visibility if needed
    // display: needsApproval ? 'visible' : 'hidden',
  });
} else {
  console.warn('[Form snippet] approver field not found');
}
`,
};

export default snippet;
