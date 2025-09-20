/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 轻量模板类型定义：与前后端均可复用
export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

/**
 * 提取模板中使用到的 ctx 顶层变量名集合。
 * - 支持点语法与顶层括号变量：ctx.user / ctx["user"]
 */
export function extractUsedVariableNames(template: JSONValue): Set<string> {
  const result = new Set<string>();

  const visit = (src: any) => {
    if (typeof src === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(src)) !== null) {
        const expr = m[1];
        // ctx.<var>
        const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let pm: RegExpExecArray | null;
        while ((pm = pathRegex.exec(expr)) !== null) {
          result.add(pm[1]);
        }
        // ctx["var"] or ctx['var']
        const bracketVarRegex = /ctx\[\s*(["'])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\1\s*\]/g;
        let bm: RegExpExecArray | null;
        while ((bm = bracketVarRegex.exec(expr)) !== null) {
          result.add(bm[2]);
        }
      }
    } else if (Array.isArray(src)) {
      src.forEach(visit);
    } else if (src && typeof src === 'object') {
      Object.values(src).forEach(visit);
    }
  };

  visit(template);
  return result;
}

/**
 * 提取模板中使用到的 ctx 顶层变量与对应的子路径数组。
 * - 返回 Map 形如：{ user: ['id', 'roles[0].name'], view: ['record.id'] }
 * - 兼容：顶层括号变量（ctx["user"])、首段括号键与数字索引（如 ["roles"][0].name -> roles[0].name）
 * - 方法调用：记录空字符串以触发服务端 attach（例如 ctx.twice(21) => { twice: [''] }）
 */
export function extractUsedVariablePaths(template: JSONValue): Record<string, string[]> {
  const usage: Record<string, string[]> = {};

  const visit = (src: any) => {
    if (typeof src === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(src)) !== null) {
        const expr = m[1];

        // 点语法：ctx.varName[...]
        const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)([^\s)]*)/g;
        let pm: RegExpExecArray | null;
        while ((pm = pathRegex.exec(expr)) !== null) {
          const varName = pm[1];
          const after = pm[2] || '';
          usage[varName] = usage[varName] || [];
          if (after.startsWith('.')) {
            usage[varName].push(after.slice(1));
          } else if (after.startsWith('[')) {
            // 首段括号键或数字索引
            const mm = after.match(/^\[\s*(["'])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
            if (mm) {
              const first = mm[2];
              const rest = mm[3] || '';
              usage[varName].push(`${first}${rest}`);
            } else {
              const mn = after.match(/^\[(\d+)\](.*)$/);
              if (mn) {
                const idx = mn[1];
                const rest = mn[2] || '';
                usage[varName].push(`[${idx}]${rest}`);
              }
            }
          } else if (after.startsWith('(')) {
            if (!usage[varName].length) usage[varName].push('');
          }
        }

        // 顶层括号变量：ctx["varName"]...
        const bracketVarRegex = /ctx\[\s*(["'])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\1\s*\]([^\s)]*)/g;
        let bm: RegExpExecArray | null;
        while ((bm = bracketVarRegex.exec(expr)) !== null) {
          const varName = bm[2];
          const after = bm[3] || '';
          usage[varName] = usage[varName] || [];
          if (after.startsWith('.')) {
            usage[varName].push(after.slice(1));
          } else if (after.startsWith('[')) {
            const mm = after.match(/^\[\s*(["'])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
            if (mm) {
              const first = mm[2];
              const rest = mm[3] || '';
              usage[varName].push(`${first}${rest}`);
            } else {
              const mn = after.match(/^\[(\d+)\](.*)$/);
              if (mn) {
                const idx = mn[1];
                const rest = mn[2] || '';
                usage[varName].push(`[${idx}]${rest}`);
              }
            }
          } else if (after.startsWith('(')) {
            if (!usage[varName].length) usage[varName].push('');
          }
        }
      }
    } else if (Array.isArray(src)) {
      src.forEach(visit);
    } else if (src && typeof src === 'object') {
      Object.values(src).forEach(visit);
    }
  };

  visit(template);
  return usage;
}
