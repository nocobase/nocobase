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
  prefix: 'sn-jsb-button',
  label: 'Render button handler',
  content: `
const { React, ReactDOM, antd } = ctx;
const { Button } = antd;

if (ctx.__reactRoot?.unmount) { try { ctx.__reactRoot.unmount(); } catch(_) {} ctx.__reactRoot = undefined; }
const node = React.createElement(Button, { type: 'primary', onClick: () => ctx.message.success(ctx.t('Clicked!')) }, ctx.t('Button'));
const root = ReactDOM.createRoot(ctx.element);
root.render(node);
ctx.__reactRoot = root;
`,
};
