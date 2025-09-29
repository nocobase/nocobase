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
  prefix: 'sn-jsb-click',
  label: '监听点击',
  content:
    `
// Render a button and bind a click handler
ctx.element.innerHTML = ` +
    '`' +
    `
  <button id="nb-jsb-btn" style="padding:6px 12px">\${ctx.t('Click me')}</button>
` +
    '`' +
    `;
const btn = document.getElementById('nb-jsb-btn');
if (btn) {
  btn.addEventListener('click', () => ctx.message.success(ctx.t('Clicked!')));
}
`,
};
