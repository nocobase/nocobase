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
  prefix: 'sn-link-visibility',
  label: 'Toggle visible',
  description: 'Show or hide another field within linkage scripts',
  locales: {
    'zh-CN': {
      label: '切换可见性',
      description: '在联动脚本中设置字段显示或隐藏',
    },
  },
  content: `
const targetFieldUid = 'FIELD_UID_OR_NAME';
const shouldHide = true;

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

fieldModel.setProps({ hiddenModel: shouldHide });
ctx.message?.success?.(
  ctx.t(shouldHide ? 'Hidden field {{name}}' : 'Shown field {{name}}', {
    name: fieldModel?.props?.label || targetFieldUid,
  }),
);
`,
};

export default snippet;
