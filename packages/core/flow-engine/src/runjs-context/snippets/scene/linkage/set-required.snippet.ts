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
  prefix: 'sn-link-required',
  label: 'Set required',
  content: `
const targetFieldUid = 'FIELD_UID_OR_NAME';
const required = true;

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

fieldModel.setProps({ required });
ctx.message?.success?.(
  ctx.t(required ? 'Set field {{name}} as required' : 'Field {{name}} is optional', {
    name: fieldModel?.props?.label || targetFieldUid,
  }),
);
`,
};
