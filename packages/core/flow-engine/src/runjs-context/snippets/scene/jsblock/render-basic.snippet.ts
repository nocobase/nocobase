/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-jsb-html',
  label: 'Render HTML',
  content:
    `
ctx.element.innerHTML = ` +
    '`' +
    `
  <div style="padding:12px">\${ctx.t('Hello JSBlock')}</div>
` +
    '`' +
    `;
`,
};
