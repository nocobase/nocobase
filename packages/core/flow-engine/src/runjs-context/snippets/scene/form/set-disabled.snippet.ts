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
  prefix: 'sn-link-disable',
  label: 'Set disabled',
  description: 'Enable or disable another field in linkage scripts',
  locales: {
    'zh-CN': {
      label: '设置禁用',
      description: '在联动脚本中启用或禁用字段',
    },
  },
  content: `
const targetFieldUid = 'FIELD_UID_OR_NAME';
const disabled = true;

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items)
  ? items
  : Array.from(items?.values?.() || items || []);
const fieldModel =
  candidates.find((item) => item?.uid === targetFieldUid) ||
  candidates.find((item) => item?.props?.name === targetFieldUid);

if (!fieldModel) {
  ctx.message?.warning?.(ctx.t('Field {{name}} not found', { name: targetFieldUid }));
  return;
}

fieldModel.setProps({ disabled });
ctx.message?.success?.(
  ctx.t(disabled ? 'Disabled field {{name}}' : 'Enabled field {{name}}', {
    name: fieldModel?.props?.label || targetFieldUid,
  }),
);
`,
};

export default snippet;
