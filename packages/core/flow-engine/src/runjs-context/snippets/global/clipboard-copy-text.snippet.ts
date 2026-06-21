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
  prefix: 'sn-clipboard-copy',
  label: 'Copy text to clipboard (function)',
  description: 'A reusable function that copies a given string to the clipboard.',
  locales: {
    'zh-CN': {
      label: '复制文本到剪贴板（函数）',
      description: '通用函数：接受一个字符串参数并复制到剪贴板。',
    },
  },
  content: `
// A general utility function that copies text to clipboard.
// Usage:
//   const ok = await copyTextToClipboard('Hello');
//   if (ok) { /* success */ } else { /* handle failure */ }
async function copyTextToClipboard(text) {
  const s = String(text ?? '');
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch (_) {
    // Fallback below
  }
}
`,
};

export default snippet;
