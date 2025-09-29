/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSItemRunJSContext'],
  prefix: 'sn-jsitem-basic',
  label: 'Render form item',
  content:
    `
ctx.element.innerHTML = ` +
    '`' +
    `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
    <h3 style="color: #1890ff; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">\${ctx.t('JS Item')}</h3>
    <div style="color:#555">\${ctx.t('This area is rendered by your JavaScript code.')}</div>
  </div>
` +
    '`' +
    `;
`,
};
