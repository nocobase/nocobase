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

    // 注册国际化过滤器
    this.registerFilter('t', (key, locale = 'en', dict = {}) => {
      if (!key) return '';
      if (!dict) return key;

      // 优先当前语言，否则 fallback 到英文
      return dict[key]?.[locale] || dict[key]?.['en'] || key;
    });

    this.registerFilter('log', (value) => {
      console.log('[Liquid log]', value);
      return value;
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
      const path = fullPath.replace(/^ctx\./, '');
      const keys = path.split('.');

      let current = result;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const isLast = i === keys.length - 1;

        if (isLast) {
          current[key] = `{{${fullPath}}}`;
        } else {
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

  /**
   * 合并步骤：获取变量 -> 构建 context -> 解析 -> 渲染
   * @param {string} template Liquid 模板字符串
   * @param {context} ctx flowContext
   */
  async renderWithFullContext(template, ctx) {
    try {
      // 1️⃣ 分析模板中的变量
      const vars = await this.fullVariables(template);

      // 2️⃣ 构造 Liquid context
      const liquidContext = this.transformLiquidContext(vars);

      // 3️⃣ 只解析变量
      const resolvedCtx = await ctx.resolveJsonTemplate(liquidContext);
      // 4️⃣ 渲染模板
      return await this.render(template, { ctx: resolvedCtx });
    } catch (err) {
      console.error('[Liquid] renderWithFullContext 错误:', err);
      return `<pre style="color:red;">Liquid 渲染错误：${err.message}</pre>`;
    }
  }
}
