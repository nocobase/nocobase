/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Liquid } from 'liquidjs';
import { merge } from 'lodash';
export class LiquidEngine extends Liquid {
  constructor(options: any) {
    super({
      extname: '.liquid',
      cache: true,
      ...options,
    });

    // 注册国际化过滤器
    this.registerFilter('t', options.ctx.t);

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

  isFieldUsed(field, paths) {
    return paths.some((path) => {
      const cleanPath = path.replace(/^ctx\./, '');
      return cleanPath.endsWith(field);
    });
  }

  enrichArrayFieldsSelective(obj, vars) {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      const value = obj[key];

      if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
        const arr = value;
        const props = Object.keys(arr[0]).filter((prop) => {
          const v = arr[0][prop];
          return ['string', 'number', 'boolean'].includes(typeof v) && this.isFieldUsed(`${key}.${prop}`, vars);
        });

        props.forEach((prop) => {
          arr[prop] = arr.map((item) => (item[prop] != null ? item[prop] : '')).join(',');
        });

        // 递归数组元素，继续处理嵌套对象
        arr.forEach((item) => this.enrichArrayFieldsSelective(item, vars));
      } else if (value && typeof value === 'object') {
        this.enrichArrayFieldsSelective(value, vars);
      }
    }
  }

  /**
   * 合并步骤：获取变量 -> 构建 context -> 解析 -> 渲染
   * @param {string} template Liquid 模板字符串
   * @param {context} ctx flowContext
   */
  async renderWithFullContext(template, ctx) {
    if (!template) {
      return;
    }
    try {
      if (typeof template === 'number') {
        template = String(template);
      }
      template = template.replace(
        /\{\{\s*t\s*\(\s*(['"])([\s\S]*?)\1\s*(?:,\s*\{\s*ns\s*:\s*(['"])([\s\S]*?)\3\s*\}\s*)?\)\s*\}\}/g,
        (raw, _q, key, _q2, ns) => {
          try {
            const translated = ns ? ctx.t(key, { ns }) : ctx.t(key);
            if (translated == null) return '';
            return /[{][{%]/.test(translated) ? `{% raw %}${translated}{% endraw %}` : translated;
          } catch {
            return raw;
          }
        },
      );
      // 1️⃣ 提取模板变量
      const vars = await this.fullVariables(template);

      // 2️⃣ 构造 Liquid 上下文（每个变量独立，不合并）
      const contexts = vars.map((v) => this.transformLiquidContext([v]));

      // 3️⃣ 分别解析变量上下文
      const resolvedList = await Promise.all(contexts.map((c) => ctx.resolveJsonTemplate(c)));

      // 4️⃣ 处理解析结果
      const resolvedCtx = resolvedList.reduce((acc, cur) => merge(acc, cur), {});

      this.enrichArrayFieldsSelective(resolvedCtx, vars);
      // 5️⃣ 渲染模板
      return await this.render(template, { ctx: resolvedCtx });
    } catch (err) {
      return template;
    }
  }
}
