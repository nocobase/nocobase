/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PropertyMeta } from '../flowContext';

/**
 * 解析变量表达式，提取属性路径
 * 支持格式: "{{ ctx.user.name }}" => ["user", "name"]
 * @param value 变量表达式字符串
 * @returns 属性路径数组，解析失败返回 null
 *
 * @example
 * extractPropertyPath("{{ ctx.user.name }}") // ["user", "name"]
 * extractPropertyPath("{{ ctx }}") // []
 * extractPropertyPath("invalid") // null
 */
export function extractPropertyPath(value: string): string[] | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/;
  const match = trimmed.match(variableRegex);

  if (!match) return null;

  const pathString = match[1];
  if (!pathString) return [];

  return pathString
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * 格式化属性路径为变量表达式
 * @param path 属性路径数组
 * @returns 变量表达式字符串
 *
 * @example
 * formatPathToVariable(["user", "name"]) // "{{ ctx.user.name }}"
 * formatPathToVariable([]) // "{{ ctx }}"
 */
export function formatPathToVariable(path: string[]): string {
  if (path.length === 0) return '{{ ctx }}';
  return `{{ ctx.${path.join('.')} }}`;
}

/**
 * 检查值是否为变量表达式
 * @param value 待检查的值
 * @returns 是否为变量表达式
 *
 * @example
 * isVariableExpression("{{ ctx.user.name }}") // true
 * isVariableExpression("static value") // false
 */
export function isVariableExpression(value: any): boolean {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\..+?)?\s*\}\}$/;
  return variableRegex.test(trimmed);
}
