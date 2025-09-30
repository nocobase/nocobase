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
  prefix: 'sn-jsf-value',
  label: 'Render field value',
  content: `
const v = String(ctx.value ?? '');
ctx.element.innerHTML = \`<span class="nb-js-field-value" style="color:#1890ff;font-weight:600">\${v}</span>\`;
`,
};
