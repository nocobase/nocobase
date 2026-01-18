/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJs } from './jsxTransform';

type PrepareRunJsCodeOptions = {
  preprocessTemplates?: boolean;
};

const RESOLVE_JSON_TEMPLATE_CALL = 'ctx.resolveJsonTemplate';
const CTX_TEMPLATE_MARKER_RE = /\{\{\s*ctx(?:\.|\[|\?\.)/;
const STRINGIFY_HELPER_BASE_NAME = '__runjs_templateValueToString';
const BARE_PLACEHOLDER_VAR_RE = /\b__runjs_ctx_tpl_\d+\b/;
const STRINGIFY_HELPER_RE = /\b__runjs_templateValueToString(?:_\d+)?\b/;
const PREPROCESSED_MARKER_RE = /\b__runjs_ctx_tpl_\d+\b|\b__runjs_templateValueToString(?:_\d+)?\b/;
const PREPARE_RUNJS_CODE_CACHE_LIMIT = 256;

const PREPARE_RUNJS_CODE_CACHE = {
  withTemplates: new Map<string, Promise<string>>(),
  withoutTemplates: new Map<string, Promise<string>>(),
};

function lruGet<V>(map: Map<string, V>, key: string): V | undefined {
  const v = map.get(key);
  if (typeof v === 'undefined') return undefined;
  map.delete(key);
  map.set(key, v);
  return v;
}

function lruSet<V>(map: Map<string, V>, key: string, value: V, limit: number): void {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  if (map.size <= limit) return;
  const oldestKey = map.keys().next().value;
  if (typeof oldestKey !== 'undefined') map.delete(oldestKey);
}

function isIdentChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_$]/.test(ch);
}

function isCtxTemplatePlaceholder(placeholder: string): boolean {
  if (!placeholder.startsWith('{{') || !placeholder.endsWith('}}')) return false;
  const inner = placeholder.slice(2, -2).trim();
  return inner.startsWith('ctx.') || inner.startsWith('ctx[') || inner.startsWith('ctx?.');
}

function readsResolveJsonTemplateCall(code: string, index: number): boolean {
  if (!code.startsWith(RESOLVE_JSON_TEMPLATE_CALL, index)) return false;
  const before = index > 0 ? code[index - 1] : '';
  const after = code[index + RESOLVE_JSON_TEMPLATE_CALL.length] || '';
  if (isIdentChar(before) || isIdentChar(after)) return false;
  return true;
}

function readLineComment(code: string, start: number): number {
  let i = start + 2;
  while (i < code.length) {
    const ch = code[i];
    i += 1;
    if (ch === '\n') break;
  }
  return i;
}

function readBlockComment(code: string, start: number): number {
  let i = start + 2;
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '*' && next === '/') {
      return i + 2;
    }
    i += 1;
  }
  return i;
}

function readQuotedString(code: string, start: number, quote: "'" | '"'): number {
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    i += 1;
    if (ch === quote) break;
  }
  return i;
}

function readTemplateLiteral(code: string, start: number): number {
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return i + 1;
    }
    if (ch === '$' && code[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < code.length && depth > 0) {
        const c = code[i];
        const n = code[i + 1];
        if (c === "'" || c === '"') {
          i = readQuotedString(code, i, c);
          continue;
        }
        if (c === '`') {
          i = readTemplateLiteral(code, i);
          continue;
        }
        if (c === '/' && n === '/') {
          i = readLineComment(code, i);
          continue;
        }
        if (c === '/' && n === '*') {
          i = readBlockComment(code, i);
          continue;
        }
        if (c === '{') depth += 1;
        else if (c === '}') depth -= 1;
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return i;
}

function extractCtxPlaceholders(source: string): string[] {
  if (!CTX_TEMPLATE_MARKER_RE.test(source)) return [];
  const out: string[] = [];
  let idx = 0;
  while (idx < source.length) {
    const start = source.indexOf('{{', idx);
    if (start === -1) break;
    const end = source.indexOf('}}', start + 2);
    if (end === -1) break;
    const placeholder = source.slice(start, end + 2);
    if (isCtxTemplatePlaceholder(placeholder)) out.push(placeholder);
    idx = end + 2;
  }
  return out;
}

function skipWhitespaceForward(code: string, start: number): number {
  let i = start;
  while (i < code.length && /\s/.test(code[i])) i += 1;
  return i;
}

function skipWhitespaceBackward(code: string, start: number): number {
  let i = start;
  while (i >= 0 && /\s/.test(code[i])) i -= 1;
  return i;
}

function isObjectLikeKeyPosition(code: string, tokenStart: number, tokenEnd: number): boolean {
  const next = skipWhitespaceForward(code, tokenEnd);
  if (code[next] !== ':') return false;
  const prev = skipWhitespaceBackward(code, tokenStart - 1);
  const prevCh = prev >= 0 ? code[prev] : '';
  return prevCh === '{' || prevCh === ',';
}

function wrapStringTokenWithReplacements(
  token: string,
  placeholders: string[],
  placeholderVar: (p: string) => string,
  stringifyHelperName: string,
): string {
  const uniq = Array.from(new Set(placeholders));
  if (!uniq.length) return token;

  // 通过运行时（同步）字符串化 helper，避免在嵌套函数里注入 `await`。
  // 保持旧语义：当值为 undefined 时，不替换模板标记本身。
  let expr = token;
  for (const p of uniq) {
    const v = placeholderVar(p);
    expr = `(${expr}).split(${JSON.stringify(p)}).join(${stringifyHelperName}(${v}, ${JSON.stringify(p)}))`;
  }
  return expr;
}

/**
 * 预处理 RunJS 源码，兼容旧版 `{{ ... }}` 占位符。
 *
 * 注意：这不是“变量解析”（这里不会计算任何值）。
 * 它会把代码重写为合法的 JS，并在执行期间调用 `ctx.resolveJsonTemplate(...)` 来解析 {{ ... }}。
 *
 * 设计说明：
 * - 为避免出现 “await is only valid in async functions” 之类的语法错误，会把所有模板解析提升到
 *   RunJS 程序的顶层，再用变量替换各处的出现位置。
 * - 对于字符串/模板字面量，不在原位置直接包一层 `await ...`。而是保留原字面量表达式，并通过
 *   一个小 helper 用 `.split().join()` 做替换，以匹配 `resolveJsonTemplate` 对 object/undefined
 *   的字符串替换行为。
 */
export function preprocessRunJsTemplates(
  code: string,
  options: {
    processBarePlaceholders?: boolean;
    processStringLiterals?: boolean;
  } = {},
): string {
  if (!CTX_TEMPLATE_MARKER_RE.test(code)) return code;
  const processBarePlaceholders = options.processBarePlaceholders !== false;
  const processStringLiterals = options.processStringLiterals !== false;
  // 避免重复预处理（例如调用方不小心把已处理过的代码再次传回 ctx.runjs）。
  // 这里使用启发式判断；这些内部符号名刻意设计得不太可能与用户代码冲突。
  if (processBarePlaceholders && processStringLiterals && PREPROCESSED_MARKER_RE.test(code)) return code;
  if (processBarePlaceholders && !processStringLiterals && BARE_PLACEHOLDER_VAR_RE.test(code)) return code;
  if (!processBarePlaceholders && processStringLiterals && STRINGIFY_HELPER_RE.test(code)) return code;

  const placeholderVars = new Map<string, string>();
  const preambleLines: string[] = [];
  let needsStringifyHelper = false;

  const usedNames = new Set<string>();
  const pickUniqueName = (base: string): string => {
    if (!code.includes(base) && !usedNames.has(base)) {
      usedNames.add(base);
      return base;
    }
    let i = 1;
    while (code.includes(`${base}_${i}`) || usedNames.has(`${base}_${i}`)) i += 1;
    const name = `${base}_${i}`;
    usedNames.add(name);
    return name;
  };
  const stringifyHelperName = pickUniqueName(STRINGIFY_HELPER_BASE_NAME);

  let placeholderCounter = 0;
  const nextPlaceholderVarName = (): string => {
    for (;;) {
      const name = `__runjs_ctx_tpl_${placeholderCounter}`;
      placeholderCounter += 1;
      if (code.includes(name) || usedNames.has(name)) continue;
      usedNames.add(name);
      return name;
    }
  };

  const getPlaceholderVar = (placeholder: string): string => {
    const existing = placeholderVars.get(placeholder);
    if (existing) return existing;
    const name = nextPlaceholderVarName();
    placeholderVars.set(placeholder, name);
    preambleLines.push(`const ${name} = await ctx.resolveJsonTemplate(${JSON.stringify(placeholder)});`);
    return name;
  };

  let out = '';
  let i = 0;

  // 显式的 `ctx.resolveJsonTemplate(...)` 调用内部不做处理。
  let resolveCallPending = false;
  let resolveParenDepth = 0;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    // 注释（始终保留；内部不做任何转换）
    if (ch === '/' && next === '/') {
      const end = readLineComment(code, i);
      out += code.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = readBlockComment(code, i);
      out += code.slice(i, end);
      i = end;
      continue;
    }

    // 字符串/模板字面量（可选转换，但在 resolveJsonTemplate 调用内部永不转换）
    if (ch === "'" || ch === '"') {
      const end = readQuotedString(code, i, ch);
      const token = code.slice(i, end);
      if (processStringLiterals && resolveParenDepth === 0) {
        const placeholders = extractCtxPlaceholders(token);
        if (placeholders.length) {
          needsStringifyHelper = true;
          const expr = wrapStringTokenWithReplacements(token, placeholders, getPlaceholderVar, stringifyHelperName);
          out += isObjectLikeKeyPosition(code, i, end) ? `[${expr}]` : expr;
        } else {
          out += token;
        }
      } else out += token;
      i = end;
      continue;
    }
    if (ch === '`') {
      const end = readTemplateLiteral(code, i);
      const token = code.slice(i, end);
      if (processStringLiterals && resolveParenDepth === 0) {
        const placeholders = extractCtxPlaceholders(token);
        if (placeholders.length) {
          needsStringifyHelper = true;
          const expr = wrapStringTokenWithReplacements(token, placeholders, getPlaceholderVar, stringifyHelperName);
          out += isObjectLikeKeyPosition(code, i, end) ? `[${expr}]` : expr;
        } else {
          out += token;
        }
      } else out += token;
      i = end;
      continue;
    }

    // 跟踪 `ctx.resolveJsonTemplate(` 的调用区域
    if (resolveParenDepth === 0 && !resolveCallPending && readsResolveJsonTemplateCall(code, i)) {
      out += RESOLVE_JSON_TEMPLATE_CALL;
      i += RESOLVE_JSON_TEMPLATE_CALL.length;
      resolveCallPending = true;
      continue;
    }
    if (resolveCallPending) {
      if (/\s/.test(ch)) {
        out += ch;
        i += 1;
        continue;
      }
      if (ch === '(') {
        out += ch;
        i += 1;
        resolveCallPending = false;
        resolveParenDepth = 1;
        continue;
      }
      // 不是调用；重置状态并按正常逻辑重新处理当前字符
      resolveCallPending = false;
      continue;
    }

    // 在 resolveJsonTemplate(...) 内部，仅跟踪括号深度并原样输出
    if (resolveParenDepth > 0) {
      if (ch === '(') resolveParenDepth += 1;
      else if (ch === ')') resolveParenDepth -= 1;
      out += ch;
      i += 1;
      continue;
    }

    if (processBarePlaceholders) {
      // 裸的 {{ ... }} 占位符 -> 运行时 await resolveJsonTemplate("{{...}}")
      if (ch === '{' && next === '{') {
        const end = code.indexOf('}}', i + 2);
        if (end !== -1) {
          const placeholder = code.slice(i, end + 2);
          if (isCtxTemplatePlaceholder(placeholder)) {
            out += getPlaceholderVar(placeholder);
            i = end + 2;
            continue;
          }
        }
      }
    }

    out += ch;
    i += 1;
  }

  if (!preambleLines.length) return out;

  const preamble: string[] = [];
  if (needsStringifyHelper) {
    preamble.push(
      `const ${stringifyHelperName} = (value, placeholder) => {`,
      `  if (typeof value === 'undefined') return placeholder;`,
      `  if (typeof value === 'object' && value !== null) {`,
      `    try {`,
      `      return JSON.stringify(value);`,
      `    } catch (e) {`,
      `      return String(value);`,
      `    }`,
      `  }`,
      `  return String(value);`,
      `};`,
    );
  }
  preamble.push(...preambleLines);

  return `${preamble.join('\n')}\n${out}`;
}

/**
 * 为执行准备用户的 RunJS 源码。
 * - 可选：运行时模板兼容重写
 * - JSX 转换（sucrase），确保 RunJS 可以安全使用 JSX
 */
export async function prepareRunJsCode(code: string, options: PrepareRunJsCodeOptions = {}): Promise<string> {
  const src = typeof code === 'string' ? code : String(code ?? '');
  const preprocessTemplates = !!options.preprocessTemplates;
  const cache = preprocessTemplates
    ? PREPARE_RUNJS_CODE_CACHE.withTemplates
    : PREPARE_RUNJS_CODE_CACHE.withoutTemplates;
  const cached = lruGet(cache, src);
  if (cached) return await cached;

  const task = (async () => {
    if (!preprocessTemplates) return await compileRunJs(src);

    // 阶段 1：仅重写“裸”的 {{ ... }} 占位符，保持代码可解析（尤其是在 JSX 转换前）。
    const preBare = preprocessRunJsTemplates(src, { processStringLiterals: false });
    // 阶段 2：JSX -> JS。
    const jsxCompiled = await compileRunJs(preBare);
    // 阶段 3：对纯 JS 输出重写字符串/模板字面量（避免破坏 JSX 属性语法）。
    return preprocessRunJsTemplates(jsxCompiled, { processBarePlaceholders: false });
  })();

  lruSet(cache, src, task, PREPARE_RUNJS_CODE_CACHE_LIMIT);

  try {
    return await task;
  } catch (e) {
    // Avoid poisoning cache if unexpected errors happen
    cache.delete(src);
    throw e;
  }
}
