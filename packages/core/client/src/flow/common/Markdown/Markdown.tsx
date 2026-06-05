/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Display } from './Display';
import { MarkdownWithContextSelector as Edit } from './Edit';

export class Markdown {
  /**
   * 渲染 Markdown
   * @param {string} text - Markdown 文本
   * @param {object} props - 其他属性
   * @returns {JSX.Element}
   */
  render(text, props) {
    if (!text) return null;

    try {
      return <Display value={text} {...props} />;
    } catch (err) {
      console.error('渲染失败:', err);
      return <pre style={{ color: 'red' }}>Markdown 渲染错误：{err.message}</pre>;
    }
  }

  /**
   * 渲染可编辑的 Markdown 组件
   * @param {object} props - 编辑器属性
   * @returns {JSX.Element}
   */
  edit(props) {
    try {
      return <Edit {...props} />;
    } catch (err) {
      return <pre style={{ color: 'red' }}>Markdown 编辑器加载错误：{err.message}</pre>;
    }
  }
}
