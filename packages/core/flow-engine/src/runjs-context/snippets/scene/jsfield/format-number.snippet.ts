/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSFieldRunJSContext', 'FormJSFieldItemRunJSContext'],
  prefix: 'sn-jsf-num',
  label: 'Format number',
  content: `
// Format number using locale
const n = Number(ctx.value ?? 0);
ctx.element.innerHTML = String(Number.isFinite(n) ? n.toLocaleString() : ctx.value ?? '');
`,
};
