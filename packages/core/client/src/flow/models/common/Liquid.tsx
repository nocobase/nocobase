/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Liquid } from 'liquidjs';

export class LiquidEngine extends Liquid {
  constructor(options = {}) {
    super({
      extname: '.liquid',
      cache: true,
      ...options,
    });
  }

  /**
   * 将路径数组转为 Liquid 模板上下文对象
   * @param {string[]} paths - 如 ['ctx.user.name', 'ctx.order.total']
   * @returns {object} 形如 { user: { name: '{{ctx.user.name}}' }, order: {...} }
   */
  transformLiquidContext(paths = []) {
    const result = {};

    for (const fullPath of paths) {
      // 去掉前缀 ctx.（如果有）
      const path = fullPath.replace(/^ctx\./, '');
      const keys = path.split('.');

      let current = result;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const isLast = i === keys.length - 1;

        if (isLast) {
          // 最后一个层级填充模板变量
          current[key] = `{{${fullPath}}}`;
        } else {
          // 创建中间层对象
          current[key] = current[key] || {};
          current = current[key];
        }
      }
    }

    return result;
  }

  /**
   * 渲染模板
   * @param {string} template - Liquid 模板字符串
   * @param {object} context - 模板上下文变量
   * @returns {Promise<string>} 渲染后的字符串
   */
  async render(template, context = {}) {
    try {
      return await this.parseAndRender(template, context);
    } catch (err) {
      console.error('[Liquid] 模板解析失败:', err);
      return `<pre style="color:red;">Liquid 模板错误：${err.message}</pre>`;
    }
  }
}
