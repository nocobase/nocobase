/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Vditor from 'vditor';
import 'vditor/dist/index.css';

export class Markdown {
  cache;
  constructor() {
    this.cache = new Map();
  }

  /**
   * 渲染 Markdown 文本为 HTML
   * @param {string} text - Markdown 文本
   * @returns {Promise<string>} HTML 字符串
   */
  async render(text) {
    if (!text) return '';
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    try {
      const html = await Vditor.md2html(text);
      this.cache.set(text, html);
      return html;
    } catch (err) {
      console.error('[Markdown] 解析失败:', err);
      return `<pre style="color:red;">Markdown 解析错误：${err.message}</pre>`;
    }
  }
}
