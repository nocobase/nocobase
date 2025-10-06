/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';

const snippet: SnippetModule = {
  contexts: ['*'],
  prefix: 'sn-viewer-dialog',
  label: 'Viewer dialog (basic)',
  description: 'Open a simple dialog via ctx.viewer.dialog and close programmatically',
  locales: {
    'zh-CN': {
      label: 'Viewer 对话框（基础）',
      description: '通过 ctx.viewer.dialog 打开简单对话框，并可编程关闭',
    },
  },
  content: `
// Open a simple viewer dialog
const dialog = ctx.viewer.dialog({
  title: ctx.t('Quick Dialog'),
  content: '<div style="padding:12px">' + ctx.t('Hello from dialog') + '</div>',
  inputArgs: { from: 'runjs' },
});

// Auto close after 2 seconds (optional)
setTimeout(() => dialog.close(), 2000);
`,
};

export default snippet;
