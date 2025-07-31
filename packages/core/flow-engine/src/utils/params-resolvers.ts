/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import { FlowContext, FlowModelContext, FlowRuntimeContext } from '../flowContext';
import type { FlowModel } from '../models';
import { RecordProxy } from '../RecordProxy';

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
 * 解析 FlowModelMeta 中的 defaultOptions，支持静态值和函数形式
 * @param defaultOptions - 可以是静态对象或返回对象的函数
 * @param ctx - 模型上下文实例，用于传递给函数形式的 defaultOptions
 * @returns 解析后的选项对象
 */
export async function resolveDefaultOptions(
  defaultOptions:
    | Record<string, any>
    | ((ctx: FlowModelContext, extra?: any) => Record<string, any> | Promise<Record<string, any>>)
    | undefined,
  ctx: FlowModelContext,
  extra?: any,
): Promise<Record<string, any>> {
  if (!defaultOptions) {
    return {};
  }

  if (typeof defaultOptions === 'function') {
    try {
      const result = await defaultOptions(ctx, extra);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultOptions function:', error);
      return {};
    }
  }

  return defaultOptions;
}

/**
 * 解析参数中的 {{xxx}} 表达式，自动处理异步属性访问
 */
export async function resolveExpressions<TModel extends FlowModel = FlowModel>(
  params: Record<string, any>,
  ctx: FlowContext,
): Promise<any> {
  if (ctx.skipResolveParams) {
    return params;
  }

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
 * 优化策略：
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
      const rawValue = ctx[firstKey];
      const isRecordProxy = rawValue instanceof RecordProxy;
      recordProxyMap.set(firstKey, isRecordProxy);
    } catch {
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
  const singleMatch = expression.match(/^\{\{\s*(.+)\s*\}\}$/);
  if (singleMatch) {
    return await processExpression(singleMatch[1], ctx);
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
    const value = await processExpression(innerExpr, ctx);
    if (value !== undefined) {
      const replacement = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
      result = result.replace(fullMatch, replacement);
    }
  }

  return result;
}
