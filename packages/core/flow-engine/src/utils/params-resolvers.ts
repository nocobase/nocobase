/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getValuesByPath } from '@nocobase/shared';
import _ from 'lodash';
import { FlowContext, FlowModelContext, FlowRuntimeContext } from '../flowContext';
import type { FlowModel } from '../models';
import type { ServerContextParams } from './serverContextParams';

/**
 * 解析 defaultParams，支持静态值和函数形式
 * @param {Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>)} defaultParams 默认参数
 * @param {FlowRuntimeContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, any>>} 解析后的参数对象
 */
export async function resolveDefaultParams<TModel extends FlowModel = FlowModel>(
  defaultParams: Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>) | undefined,
  ctx: FlowContext,
): Promise<Record<string, any>> {
  if (!defaultParams) {
    return {};
  }

  if (typeof defaultParams === 'function') {
    try {
      const result = await defaultParams(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultParams function:', error);
      return {};
    }
  }

  return defaultParams;
}

/**
 * 解析 FlowModelMeta 中的 createModelOptions，支持静态值和函数形式
 * @param defaultOptions - 可以是静态对象或返回对象的函数
 * @param ctx - 模型上下文实例，用于传递给函数形式
 * @returns 解析后的选项对象
 */
export async function resolveCreateModelOptions(
  createModelOptions:
    | Record<string, any>
    | ((ctx: FlowModelContext, extra?: any) => Record<string, any> | Promise<Record<string, any>>)
    | undefined,
  ctx: FlowModelContext,
  extra?: any,
): Promise<Record<string, any>> {
  if (!createModelOptions) {
    return {};
  }

  if (typeof createModelOptions === 'function') {
    try {
      const result = await createModelOptions(ctx, extra);
      return result || {};
    } catch (error) {
      console.error('Error resolving createModelOptions function:', error);
      return {};
    }
  }

  return createModelOptions;
}

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

// =========================
// variables:resolve 微批 + 去重（前端）
// =========================

type BatchPayload = {
  template: JSONValue;
  contextParams?: ServerContextParams | undefined;
};

type QueueItem = {
  id: string;
  ctx: FlowRuntimeContext;
  payload: BatchPayload;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  runId: string;
  dedupKey: string;
};

type Aggregator = {
  queue: QueueItem[];
  timer: ReturnType<typeof setTimeout> | null;
  inflightByRun: Map<string, Map<string, Promise<unknown>>>;
};

const VAR_AGGREGATOR: Aggregator = { queue: [], timer: null, inflightByRun: new Map() };
const BATCH_FLUSH_DELAY_MS = 10;

// 使用 lodash 对象操作，按键名递归排序，便于稳定 stringify
function sortKeysDeep(input: any): any {
  if (Array.isArray(input)) return input.map(sortKeysDeep);
  if (_.isPlainObject(input)) {
    const entries = Object.entries(input).map(([k, v]) => [k, sortKeysDeep(v)] as [string, unknown]);
    const sortedEntries = _.sortBy(entries, ([k]) => k);
    return Object.fromEntries(sortedEntries);
  }
  return input;
}

function stableStringifyOrdered(obj: unknown): string {
  try {
    return JSON.stringify(sortKeysDeep(obj));
  } catch {
    try {
      return JSON.stringify(obj as Record<string, unknown>);
    } catch {
      return String(obj);
    }
  }
}

export function enqueueVariablesResolve(ctx: FlowRuntimeContext, payload: BatchPayload): Promise<unknown> {
  const agg = VAR_AGGREGATOR;
  const runId = ctx.runId || 'GLOBAL';
  const dedupKey = stableStringifyOrdered(payload);

  let runMap = agg.inflightByRun.get(runId);
  if (!runMap) {
    runMap = new Map<string, Promise<unknown>>();
    agg.inflightByRun.set(runId, runMap);
  }
  const existing = runMap.get(dedupKey);
  if (existing) return existing;

  let resolveFn!: (v: unknown) => void;
  let rejectFn!: (e: unknown) => void;
  const p = new Promise<unknown>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  runMap.set(dedupKey, p);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const item: QueueItem = { id, ctx, payload, resolve: resolveFn, reject: rejectFn, runId, dedupKey };
  agg.queue.push(item);

  const flush = async () => {
    const items = agg.queue.splice(0, agg.queue.length);
    agg.timer = null;
    if (!items.length) return;
    const api = items[0].ctx?.api;
    if (!api) {
      // 无 API 客户端，直接回退原模板
      for (const it of items) {
        try {
          it.resolve(it.payload.template);
        } catch (e) {
          it.reject(e);
        } finally {
          agg.inflightByRun.get(it.runId)?.delete(it.dedupKey);
        }
      }
      return;
    }
    try {
      const batch = items.map((it) => ({
        id: it.id,
        template: it.payload.template,
        contextParams: it.payload.contextParams || {},
      }));
      const res = await api.request({ method: 'POST', url: 'variables:resolve', data: { values: { batch } } });
      // 兼容形态：{ data: { data: { results } } } | { data: { results } } | { results }
      const top = (res as { data?: unknown }).data ?? res;
      const root = (top as { data?: unknown }).data ?? top;
      const arr1 = (root as any)?.results;
      const resultsArr: Array<{ id?: unknown; data?: unknown }> = Array.isArray(arr1)
        ? (arr1 as Array<{ id?: unknown; data?: unknown }>)
        : Array.isArray(root)
          ? (root as Array<{ id?: unknown; data?: unknown }>)
          : [];
      const map = new Map<string, unknown>();
      for (const r of resultsArr) {
        const k = r?.id != null ? String(r.id) : '';
        if (k) map.set(k, r?.data);
      }
      for (const it of items) {
        try {
          const k = String(it.id);
          const resolved = map.has(k) ? map.get(k) : it.payload.template;
          it.resolve(resolved);
        } catch (e) {
          it.reject(e);
        } finally {
          agg.inflightByRun.get(it.runId)?.delete(it.dedupKey);
        }
      }
    } catch (e) {
      for (const it of items) {
        try {
          ctx?.logger?.warn?.({ err: e }, 'variables:resolve(batch) failed, fallback');
          it.resolve(it.payload.template);
        } catch (err) {
          it.reject(err);
        } finally {
          agg.inflightByRun.get(it.runId)?.delete(it.dedupKey);
        }
      }
    }
  };
  if (!agg.timer) {
    agg.timer = setTimeout(flush, BATCH_FLUSH_DELAY_MS);
  }
  return p;
}

/**
 * 解析参数中的 {{xxx}} 表达式，自动处理异步属性访问
 */
export async function resolveExpressions<TModel extends FlowModel = FlowModel>(
  params: JSONValue,
  ctx: FlowContext,
): Promise<any> {
  const compile = async (source: any): Promise<any> => {
    /**
     * 检测字符串中是否包含表达式
     *
     * 正则解析：/\{\{.*?\}\}/
     * - \{\{                 匹配字面量 "{{"
     * - .*?                  非贪婪匹配：0 或多个任意字符
     * - \}\}                 匹配字面量 "}}"
     *
     * 功能：快速检测字符串是否包含 {{ }} 表达式，无需捕获内容
     *
     * 匹配示例：
     * ✅ "{{ ctx.user }}"              -> 包含表达式
     * ✅ "Hello {{ name }}"            -> 包含表达式
     * ✅ "{{ a }} and {{ b }}"         -> 包含表达式
     * ❌ "Hello world"                 -> 不包含表达式
     */
    if (typeof source === 'string' && /\{\{.*?\}\}/.test(source)) {
      return await compileExpression(source, ctx);
    }

    if (Array.isArray(source)) {
      return Promise.all(source.map(compile));
    }

    if (source && typeof source === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(source)) {
        result[key] = await compile(value);
      }
      return result;
    }

    return source;
  };

  return compile(params);
}

/**
 * 统一的表达式解析函数 - 基于字符串预处理的 await 插入策略
 *
 * 核心理念：
 * 1. 保持原始表达式的计算顺序和运算符优先级
 * 2. 通过字符串预处理插入 await，而非变量替换
 * 3. 动态检测 RecordProxy 实例
 *
 * @param expression 表达式内容（不包含 {{ }}），如：'ctx.user.name' 或 'ctx.aa.bb + ctx.cc'
 * @param ctx FlowContext 上下文对象
 * @returns 解析结果，失败时抛出异常
 */
async function processExpression(expression: string, ctx: FlowContext): Promise<any> {
  const processedExpr = await preprocessExpression(expression.trim(), ctx);
  const result = await ctx.runjs(`return ${processedExpr}`, { t: ctx.t });
  return result?.success ? result.value : undefined;
}

/**
 * 预处理表达式字符串，插入必要的 await 和 RecordProxy 检查
 *
 * 1. 统一提取所有一层 ctx 路径（如 ctx.record, ctx.user）
 * 2. 批量 await 获取这些值，判断是否为 RecordProxy 实例
 * 3. 根据预处理结果决定每个多层路径的 await 插入方式
 * 4. 避免重复解析，提高性能
 *
 * @param expression 原始表达式
 * @param ctx FlowContext
 * @returns 预处理后的表达式字符串
 */
export async function preprocessExpression(expression: string, ctx: FlowContext): Promise<string> {
  /**
   * 匹配所有 ctx 路径表达式（排除函数调用）
   *
   * 正则解析：
   * - ctx\.                                           匹配字面量 "ctx."
   * - ([a-zA-Z_$][a-zA-Z0-9_$]*                      第一个标识符（首字符：字母/下划线/$，后续：字母/数字/下划线/$）
   * - (?:                                            开始非捕获组（可重复的路径组件）
   *   (?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)|                 点号属性访问：.property
   *   (?:\[[^\]]+\])                                  数组索引访问：[0] 或 [key]
   * )*                                               结束非捕获组，0或多次重复
   * )                                                结束主捕获组
   * (?!\s*\()                                        负前瞻：确保后面不跟空格和左括号（排除函数调用）
   * /g                                               全局匹配标志
   *
   * 匹配示例：
   * ✅ ctx.user              -> 捕获: "user"
   * ✅ ctx.user.name         -> 捕获: "user.name"
   * ✅ ctx.items[0]          -> 捕获: "items[0]"
   * ✅ ctx.items[0].name     -> 捕获: "items[0].name"
   * ✅ ctx.data[key].value   -> 捕获: "data[key].value"
   * ❌ ctx.method()          -> 不匹配（函数调用）
   * ❌ ctx.method (         -> 不匹配（函数调用）
   */
  const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*(?:(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)|(?:\[[^\]]+\]))*)(?!\s*\()/g;

  const pathMatches: Array<{ fullPath: string; firstKey: string; restPath: string }> = [];
  const firstLevelKeys = new Set<string>();

  // 收集所有需要处理的路径和一层键
  let match;
  while ((match = pathRegex.exec(expression)) !== null) {
    const fullPath = match[0]; // 'ctx.record' 或 'ctx.items[0].name'
    const pathAfterCtx = match[1]; // 'record' 或 'items[0].name'

    // 提取第一层键（标识符）和剩余路径
    const firstKeyMatch = pathAfterCtx.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (firstKeyMatch) {
      const firstKey = firstKeyMatch[1];
      const restPath = pathAfterCtx.substring(firstKey.length); // 可能包含 [0].name 等

      pathMatches.push({
        fullPath,
        firstKey,
        restPath, // 单层路径时为空字符串，多层路径可能包含数组索引
      });
      firstLevelKeys.add(firstKey);
    }
  }

  if (pathMatches.length === 0) {
    return expression;
  }

  // 批量获取一层路径的值并检测 RecordProxy
  const recordProxyMap = new Map<string, boolean>();

  for (const firstKey of firstLevelKeys) {
    try {
      // 检查原始值是否为 RecordProxy 实例（不通过 await）
      const rawValue = await ctx[firstKey];
      const isRecordProxy = rawValue && rawValue.__isRecordProxy__ === true;
      recordProxyMap.set(firstKey, isRecordProxy);
    } catch (error) {
      recordProxyMap.set(firstKey, false);
    }
  }

  // 按路径长度排序，长路径优先处理（避免替换冲突）
  pathMatches.sort((a, b) => b.fullPath.length - a.fullPath.length);

  // 根据预处理结果生成优化后的表达式
  let processedExpr = expression;

  for (const { fullPath, firstKey, restPath } of pathMatches) {
    const isRecordProxy = recordProxyMap.get(firstKey) || false;

    let processedPath: string;
    if (restPath === '') {
      // 单层路径：ctx.a -> await ctx.a
      processedPath = `await ctx.${firstKey}`;
    } else {
      // 多层路径：支持 .property、[index]、?.property 等语法
      // 例如：ctx.items[0].name -> (await ctx.items)[0].name
      //      ctx.user?.name -> (await ctx.user)?.name
      //      ctx.record.author.name -> await (await ctx.record).author.name (RecordProxy)
      processedPath = isRecordProxy
        ? `await (await ctx.${firstKey})${restPath}` // RecordProxy：整个路径需要 await
        : `(await ctx.${firstKey})${restPath}`; // 普通对象：只在第一层加 await
    }

    /**
     * 精确替换路径表达式（避免误替换）
     *
     * 注意：对于包含数组索引等特殊字符的路径，需要转义所有正则特殊字符
     *
     * 替换示例：
     * - fullPath: "ctx.items[0].name"
     * - 转义后: "ctx\\.items\\[0\\]\\.name"
     * - 正则: /\bctx\.items\[0\]\.name\b/g
     */
    const escapedFullPath = fullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedFullPath}\\b`, 'g');
    processedExpr = processedExpr.replace(regex, processedPath);
  }

  return processedExpr;
}

/**
 * 编译表达式，使用统一的解析逻辑
 */
async function compileExpression<TModel extends FlowModel = FlowModel>(expression: string, ctx: FlowContext) {
  // 仅点号路径匹配：ctx.a.b.c（不支持括号/函数/索引），用于数组聚合取值
  const matchDotOnly = (expr: string): string | null => {
    // 顶层变量名仍使用 JS 标识符规则（与 ctx.defineProperty 保持一致）；
    // 子路径允许包含 '-'（例如 formValues.oho-test.o2m-users）。
    const m = expr
      .trim()
      .match(/^ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\.([a-zA-Z_$][a-zA-Z0-9_$-]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$-]*)*))?$/);
    if (!m) return null;
    return m[2] ? `${m[1]}.${m[2]}` : m[1];
  };

  // 基于 getValuesByPath 的聚合取值：支持数组扁平化，仅支持 '.' 访问
  const resolveDotOnlyPath = async (dotPath: string): Promise<any> => {
    const segs = dotPath.split('.');
    const first = segs.shift();
    if (!first) return undefined;
    const base = await (ctx as any)[first];
    if (segs.length === 0) return base;
    return getValuesByPath(base as object, segs.join('.'));
  };

  const resolveInnerExpression = async (innerExpr: string): Promise<any> => {
    const dotPath = matchDotOnly(innerExpr);
    if (dotPath) {
      const resolved = await resolveDotOnlyPath(dotPath);
      // 当 dotPath 含 '-' 时可能与减号运算符存在歧义，例如：ctx.aa.bb-ctx.cc。
      // 若按 path 解析未取到值，则回退到 JS 表达式解析，尽量保持兼容。
      if (resolved === undefined && dotPath.includes('-')) {
        return await processExpression(innerExpr, ctx);
      }
      return resolved;
    }
    return await processExpression(innerExpr, ctx);
  };

  /**
   * 单个表达式模式匹配
   *
   * 正则解析：/^\{\{\s*(.+)\s*\}\}$/
   * - ^                    字符串开始
   * - \{\{                 匹配字面量 "{{"
   * - \s*                  匹配 0 或多个空白字符
   * - (.+)                 捕获组：匹配 1 或多个任意字符（表达式内容）
   * - \s*                  匹配 0 或多个空白字符
   * - \}\}                 匹配字面量 "}}"
   * - $                    字符串结束
   *
   * 匹配示例：
   * ✅ "{{ ctx.user.name }}"     -> 捕获: "ctx.user.name"
   * ✅ "{{ctx.user}}"            -> 捕获: "ctx.user"
   * ❌ "Hello {{ ctx.user }}"    -> 不匹配（不是纯表达式）
   */
  const singleMatch = expression.match(/^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/);
  if (singleMatch) {
    const inner = singleMatch[1];
    return await resolveInnerExpression(inner);
  }

  /**
   * 模板字符串中的多个表达式匹配
   *
   * 正则解析：/\{\{\s*(.+?)\s*\}\}/g
   * - \{\{                 匹配字面量 "{{"
   * - \s*                  匹配 0 或多个空白字符
   * - (.+?)                捕获组：非贪婪匹配 1 或多个任意字符（表达式内容）
   * - \s*                  匹配 0 或多个空白字符
   * - \}\}                 匹配字面量 "}}"
   * - /g                   全局匹配标志
   *
   * 匹配示例：
   * ✅ "Hello {{ user.name }}, age: {{ user.age }}"
   *    -> 匹配: ["{{ user.name }}", "{{ user.age }}"]
   *    -> 捕获: ["user.name", "user.age"]
   */
  const matches = [...expression.matchAll(/\{\{\s*(.+?)\s*\}\}/g)];
  let result = expression;

  for (const [fullMatch, innerExpr] of matches) {
    const value = await resolveInnerExpression(innerExpr);
    if (value !== undefined) {
      const replacement = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
      result = result.replace(fullMatch, replacement);
    }
  }

  return result;
}
