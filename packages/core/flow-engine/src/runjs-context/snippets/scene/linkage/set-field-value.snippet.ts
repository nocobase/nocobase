/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['*'],
  prefix: 'sn-link-set',
  label: 'Set field value',
  content: `
// Update another field in the same form/block
const targetFieldUid = 'FIELD_UID_OR_NAME';
const nextValue = ctx.record?.status ?? ctx.t('Updated value');

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates: any[] = Array.isArray(items)
  ? items
  : Array.from(items?.values?.() || items || []);
const fieldModel =
  candidates.find((item) => item?.uid === targetFieldUid) ||
  candidates.find((item) => item?.props?.name === targetFieldUid);

if (!fieldModel) {
  ctx.message?.warning?.(ctx.t('Field {{name}} not found', { name: targetFieldUid }));
  return;
}

fieldModel.setProps({ value: nextValue });
ctx.message?.success?.(
  ctx.t('Updated field {{name}}', { name: fieldModel?.props?.label || targetFieldUid }),
);
`,
};
