/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */
// 因为这里有 commonjs，在 vitest 下会报错，所以忽略这个文件

import type MarkdownIt from 'markdown-it';

/**
 * from https://github.com/agoose77/markdown-it-mermaid
 */

export default function mermaidPlugin(md: MarkdownIt) {
  function getLangName(info: string): string {
    return info.split(/\s+/g)[0];
  }

  // Store reference to original renderer.
  const defaultFenceRenderer = md.renderer.rules.fence;

  // Mermaid 10 renders asynchronously. Keep MarkdownIt synchronous by emitting a safe source placeholder;
  // parseMarkdown replaces each placeholder after awaiting Mermaid.render().
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();
    const langName = info ? getLangName(info) : '';

    if (['mermaid', '{mermaid}'].indexOf(langName) === -1) {
      if (defaultFenceRenderer !== undefined) {
        return defaultFenceRenderer(tokens, idx, options, env, self);
      }
      return '';
    }
    return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`;
  };
}
