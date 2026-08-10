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

export type VariableUsageExtractionResult = {
  unsupportedDynamicPath: boolean;
  usage: Record<string, string[]>;
};

type CtxReference = {
  methodCall: boolean;
  path?: string;
  unsupportedDynamicPath: boolean;
  varName: string;
};

function isObject(value: unknown): value is Record<string, JSONValue> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isIdentifierStart(char: string | undefined) {
  return !!char && /[a-zA-Z_$]/.test(char);
}

function isIdentifierPart(char: string | undefined) {
  return !!char && /[a-zA-Z0-9_$]/.test(char);
}

function skipSpaces(input: string, index: number) {
  let next = index;
  while (/\s/.test(input[next] || '')) next += 1;
  return next;
}

function skipPostfix(input: string, index: number) {
  let next = skipSpaces(input, index);
  while (input[next] === '!') {
    next = skipSpaces(input, next + 1);
  }
  return next;
}

function previousNonSpaceIndex(input: string, index: number) {
  let next = index;
  while (next >= 0 && /\s/.test(input[next] || '')) next -= 1;
  return next;
}

function isGroupedCtxReference(input: string, start: number) {
  const openParenIndex = previousNonSpaceIndex(input, start - 1);
  if (input[openParenIndex] !== '(') return false;

  const beforeOpenParenIndex = previousNonSpaceIndex(input, openParenIndex - 1);
  if (beforeOpenParenIndex < 0) return true;

  const beforeOpenParen = input[beforeOpenParenIndex];
  return !isIdentifierPart(beforeOpenParen) && beforeOpenParen !== ')' && beforeOpenParen !== ']';
}

function hasGroupedContinuation(input: string, index: number) {
  const closeParenIndex = skipSpaces(input, index);
  if (input[closeParenIndex] !== ')') return false;

  const continuationIndex = skipSpaces(input, closeParenIndex + 1);
  return (
    input[continuationIndex] === '.' || input[continuationIndex] === '[' || input.startsWith('?.', continuationIndex)
  );
}

function readIdentifier(input: string, index: number): { next: number; value: string } | null {
  if (!isIdentifierStart(input[index])) return null;
  let next = index + 1;
  while (isIdentifierPart(input[next])) next += 1;
  return { value: input.slice(index, next), next };
}

function readNumber(input: string, index: number): { next: number; value: string } | null {
  const match = input.slice(index).match(/^\d+/);
  return match ? { value: match[0], next: index + match[0].length } : null;
}

function readQuotedProperty(input: string, index: number): { next: number; value: string } | null {
  const quote = input[index];
  if (quote !== '"' && quote !== "'") return null;
  let next = index + 1;
  let value = '';
  while (next < input.length) {
    const char = input[next];
    if (char === '\\') {
      value += input.slice(next, next + 2);
      next += 2;
      continue;
    }
    if (char === quote) {
      return { value, next: next + 1 };
    }
    value += char;
    next += 1;
  }
  return null;
}

function readBracketAccess(input: string, index: number) {
  let next = skipSpaces(input, index + 1);
  const quoted = readQuotedProperty(input, next);
  if (quoted) {
    next = skipSpaces(input, quoted.next);
    if (input[next] !== ']') return { dynamic: true as const };
    return { dynamic: false as const, kind: 'property' as const, next: next + 1, value: quoted.value };
  }

  const number = readNumber(input, next);
  if (number) {
    next = skipSpaces(input, number.next);
    if (input[next] !== ']') return { dynamic: true as const };
    return { dynamic: false as const, kind: 'index' as const, next: next + 1, value: number.value };
  }

  return { dynamic: true as const };
}

function appendPathSegment(segments: string[], kind: 'property' | 'index', value: string) {
  if (kind === 'property') {
    segments.push(value);
    return;
  }
  if (segments.length) {
    segments[segments.length - 1] = `${segments[segments.length - 1]}[${value}]`;
    return;
  }
  segments.push(`[${value}]`);
}

function readAccess(input: string, index: number) {
  const next = skipPostfix(input, index);
  if (input[next] === '[') {
    return readBracketAccess(input, next);
  }
  if (input.startsWith('?.', next)) {
    const propertyStart = skipSpaces(input, next + 2);
    if (input[propertyStart] === '[') {
      return readBracketAccess(input, propertyStart);
    }
    const identifier = readIdentifier(input, propertyStart) || readNumber(input, propertyStart);
    return identifier
      ? { dynamic: false as const, kind: 'property' as const, next: identifier.next, value: identifier.value }
      : null;
  }
  if (input[next] === '.') {
    const propertyStart = skipSpaces(input, next + 1);
    const identifier = readIdentifier(input, propertyStart) || readNumber(input, propertyStart);
    return identifier
      ? { dynamic: false as const, kind: 'property' as const, next: identifier.next, value: identifier.value }
      : null;
  }
  return null;
}

function parseDotOnlyCtxReference(expr: string): CtxReference | null {
  const trimmed = expr.trim();
  const segment = '(?:[a-zA-Z_$][a-zA-Z0-9_$-]*|\\d+)';
  const match = trimmed.match(new RegExp(`^ctx\\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\\.(${segment}(?:\\.${segment})*))?$`));
  if (!match) return null;
  return {
    methodCall: false,
    path: match[2] || undefined,
    unsupportedDynamicPath: false,
    varName: match[1],
  };
}

function parseCtxReference(input: string, start: number): { next: number; reference: CtxReference } | null {
  if (input.slice(start, start + 3) !== 'ctx') return null;
  if (isIdentifierPart(input[start - 1]) || isIdentifierPart(input[start + 3])) return null;

  if (isGroupedCtxReference(input, start)) {
    return {
      next: start + 3,
      reference: {
        methodCall: false,
        unsupportedDynamicPath: true,
        varName: '',
      },
    };
  }

  const rootAccess = readAccess(input, start + 3);
  if (!rootAccess) return null;
  if (rootAccess.dynamic) {
    return {
      next: start + 3,
      reference: {
        methodCall: false,
        unsupportedDynamicPath: true,
        varName: '',
      },
    };
  }
  if (rootAccess.kind !== 'property') {
    return null;
  }

  const segments: string[] = [];
  let next = rootAccess.next;
  let methodCall = false;
  let unsupportedDynamicPath = false;

  while (next < input.length) {
    const accessStart = skipPostfix(input, next);
    if ((input[accessStart] === '(' || input.startsWith('?.(', accessStart)) && !segments.length) {
      methodCall = true;
      next = accessStart;
      break;
    }

    const access = readAccess(input, next);
    if (!access) {
      next = accessStart;
      if (input[accessStart] === '[' || input[accessStart] === '.' || input.startsWith('?.', accessStart)) {
        unsupportedDynamicPath = true;
      }
      break;
    }
    if (access.dynamic) {
      unsupportedDynamicPath = true;
      next = accessStart;
      break;
    }
    appendPathSegment(segments, access.kind, access.value);
    next = access.next;
  }

  const path = segments.join('.');
  return {
    next: Math.max(next, rootAccess.next),
    reference: {
      methodCall,
      path: path || undefined,
      unsupportedDynamicPath: unsupportedDynamicPath || hasGroupedContinuation(input, next),
      varName: rootAccess.value,
    },
  };
}

function collectCtxReferences(expr: string): CtxReference[] {
  const dotOnly = parseDotOnlyCtxReference(expr);
  if (dotOnly) return [dotOnly];

  const references: CtxReference[] = [];
  for (let index = 0; index < expr.length; index += 1) {
    if (expr.slice(index, index + 3) !== 'ctx') continue;
    const parsed = parseCtxReference(expr, index);
    if (!parsed) continue;
    references.push(parsed.reference);
    index = Math.max(index, parsed.next - 1);
  }
  return references;
}

function addUsagePath(usage: Record<string, string[]>, varName: string, path?: string, methodCall?: boolean) {
  usage[varName] = usage[varName] || [];
  if (path) {
    usage[varName].push(path);
  } else if (methodCall && !usage[varName].includes('')) {
    usage[varName].push('');
  }
}

/**
 * 提取模板中的 ctx 使用情况。该函数只做静态扫描，不执行表达式。
 */
export function extractVariableUsage(template: JSONValue): VariableUsageExtractionResult {
  const usage: Record<string, string[]> = {};
  let unsupportedDynamicPath = false;

  const visitExpression = (expr: string) => {
    for (const reference of collectCtxReferences(expr)) {
      if (reference.unsupportedDynamicPath) {
        unsupportedDynamicPath = true;
        continue;
      }
      if (!reference.varName) continue;
      addUsagePath(usage, reference.varName, reference.path, reference.methodCall);
    }
  };

  const visit = (src: JSONValue) => {
    if (typeof src === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(src)) !== null) {
        visitExpression(match[1]);
      }
      return;
    }
    if (Array.isArray(src)) {
      src.forEach(visit);
      return;
    }
    if (isObject(src)) {
      Object.values(src).forEach(visit);
    }
  };

  visit(template);
  return { unsupportedDynamicPath, usage };
}

/**
 * 提取模板中使用到的 ctx 顶层变量名集合。
 * - 支持点语法与顶层括号变量：ctx.user / ctx["user"]
 */
export function extractUsedVariableNames(template: JSONValue): Set<string> {
  return new Set(Object.keys(extractVariableUsage(template).usage));
}

/**
 * 提取模板中使用到的 ctx 顶层变量与对应的子路径数组。
 * - 返回 Map 形如：{ user: ['id', 'roles[0].name'], view: ['record.id'] }
 * - 兼容：顶层括号变量（ctx["user"])、首段括号键与数字索引（如 ["roles"][0].name -> roles[0].name）
 * - 方法调用：记录空字符串以触发服务端 attach（例如 ctx.twice(21) => { twice: [''] }）
 */
export function extractUsedVariablePaths(template: JSONValue): Record<string, string[]> {
  return extractVariableUsage(template).usage;
}
