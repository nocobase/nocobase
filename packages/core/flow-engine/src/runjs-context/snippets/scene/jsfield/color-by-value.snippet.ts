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
  prefix: 'sn-jsf-color',
  label: 'Color by value',
  content: `
// Colorize based on numeric sign
const n = Number(ctx.value ?? 0);
const color = Number.isFinite(n) ? (n > 0 ? 'green' : n < 0 ? 'red' : '#999') : '#555';
ctx.element.innerHTML = '<span style=' + JSON.stringify('color:' + color) + '>' + String(ctx.value ?? '') + '</span>';
`,
};
