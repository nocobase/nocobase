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
  prefix: 'sn-jsx-unmount',
  label: 'JSX卸载',
  content: `
if (ctx.__reactRoot?.unmount) { try { ctx.__reactRoot.unmount(); } catch(_) {} }
ctx.__reactRoot = undefined;
ctx.element.innerHTML = '';
`,
};
