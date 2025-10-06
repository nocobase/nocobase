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
  label: 'Copy field value',
  description: 'Click to copy current field value to clipboard',
  locales: {
    'zh-CN': {
      label: '复制字段值',
      description: '点击复制当前字段值到剪贴板',
    },
  },
  content: `
const text = String(ctx.value ?? '');
ctx.element.innerHTML = '<a class="nb-copy" style="cursor:pointer;color:#1677ff">' +
  ctx.t('Copy') + '</a>';

ctx.element.querySelector('.nb-copy')?.addEventListener('click', async () => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for legacy browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    ctx.message.success(ctx.t('Copied'));
  } catch (e) {
    ctx.message.error(ctx.t('Copy failed'));
  }
});
`,
};

export default snippet;
