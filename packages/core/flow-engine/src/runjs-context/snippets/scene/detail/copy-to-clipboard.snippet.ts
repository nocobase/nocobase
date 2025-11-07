/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSFieldRunJSContext } from '../../../contexts/JSFieldRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSFieldRunJSContext],
  prefix: 'sn-jsf-copy',
  label: 'Display text field with copy button',
  description: 'Render the text field value with a copy-to-clipboard button',
  locales: {
    'zh-CN': {
      label: '将文本字段显示为复制按钮',
      description: '展示字段值并提供快捷复制到剪贴板的按钮',
    },
  },
  content: `
const text = String(ctx.value ?? '');
ctx.element.innerHTML = '<a class="nb-copy" style="cursor:pointer;color:#1677ff">' +
  ctx.t('Copy') + '</a>';

ctx.element.querySelector('.nb-copy')?.addEventListener('click', async () => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  ctx.message.success(ctx.t('Copied'));
});
`,
};

export default snippet;
