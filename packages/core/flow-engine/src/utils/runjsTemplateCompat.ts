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
const CTX_LIBS_MARKER_RE = /\bctx(?:\?\.|\.)libs\b/;
const STRINGIFY_HELPER_BASE_NAME = '__runjs_templateValueToString';
const BARE_PLACEHOLDER_VAR_RE = /\b__runjs_ctx_tpl_\d+\b/;
const STRINGIFY_HELPER_RE = /\b__runjs_templateValueToString(?:_\d+)?\b/;
const PREPROCESSED_MARKER_RE = /\b__runjs_ctx_tpl_\d+\b|\b__runjs_templateValueToString(?:_\d+)?\b/;
const ENSURE_LIBS_MARKER_RE = /\b__runjs_ensure_libs\b/;
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

function skipSpaceAndCommentsForward(code: string, start: number): number {
  let i = start;
  for (;;) {
    i = skipWhitespaceForward(code, i);
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '/' && next === '/') {
      i = readLineComment(code, i);
      continue;
    }
    if (ch === '/' && next === '*') {
      i = readBlockComment(code, i);
      continue;
    }
    return i;
  }
}

function isIdentStartChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z_$]/.test(ch);
}

function readIdentifier(code: string, start: number): { name: string; end: number } | null {
  const first = code[start];
  if (!isIdentStartChar(first)) return null;
  let i = start + 1;
  while (i < code.length && isIdentChar(code[i])) i += 1;
  return { name: code.slice(start, i), end: i };
}

function readSimpleStringLiteralValue(
  code: string,
  start: number,
  quote: "'" | '"',
): { value: string; end: number } | null {
  if (code[start] !== quote) return null;
  let i = start + 1;
  let value = '';
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      const n = code[i + 1];
      if (typeof n === 'undefined') break;
      value += n;
      i += 2;
      continue;
    }
    if (ch === quote) {
      return { value, end: i + 1 };
    }
    value += ch;
    i += 1;
  }
  return null;
}

function readsCtxLibsBase(code: string, index: number): number | null {
  if (!code.startsWith('ctx', index)) return null;
  const before = index > 0 ? code[index - 1] : '';
  const after = code[index + 3] || '';
  if (isIdentChar(before) || isIdentChar(after)) return null;

  const tail = code.slice(index + 3);
  if (tail.startsWith('.libs')) return index + 3 + 5; // ".libs"
  if (tail.startsWith('?.libs')) return index + 3 + 6; // "?.libs"
  return null;
}

function tryReadCtxLibAccess(code: string, index: number): { end: number; key?: string } | null {
  const baseEnd = readsCtxLibsBase(code, index);
  if (baseEnd === null) return null;
  let i = skipSpaceAndCommentsForward(code, baseEnd);

  const ch = code[i];
  const next = code[i + 1];
  const next2 = code[i + 2];

  // Optional chaining computed: ctx.libs?.['x']
  if (ch === '?' && next === '.' && next2 === '[') {
    i = skipSpaceAndCommentsForward(code, i + 3);
    const q = code[i];
    if (q === "'" || q === '"') {
      const parsed = readSimpleStringLiteralValue(code, i, q);
      if (!parsed) return { end: i + 1 };
      let j = skipSpaceAndCommentsForward(code, parsed.end);
      if (code[j] === ']') j += 1;
      return { end: j, key: parsed.value };
    }
    return { end: i };
  }

  // Computed: ctx.libs['x']
  if (ch === '[') {
    i = skipSpaceAndCommentsForward(code, i + 1);
    const q = code[i];
    if (q === "'" || q === '"') {
      const parsed = readSimpleStringLiteralValue(code, i, q);
      if (!parsed) return { end: i + 1 };
      let j = skipSpaceAndCommentsForward(code, parsed.end);
      if (code[j] === ']') j += 1;
      return { end: j, key: parsed.value };
    }
    return { end: i };
  }

  // Optional chaining dot: ctx.libs?.x
  if (ch === '?' && next === '.') {
    i = skipSpaceAndCommentsForward(code, i + 2);
    const ident = readIdentifier(code, i);
    if (!ident) return { end: i };
    return { end: ident.end, key: ident.name };
  }

  // Dot: ctx.libs.x
  if (ch === '.') {
    i = skipSpaceAndCommentsForward(code, i + 1);
    const ident = readIdentifier(code, i);
    if (!ident) return { end: i };
    return { end: ident.end, key: ident.name };
  }

  return { end: baseEnd };
}

function parseDestructuredKeysFromObjectPattern(pattern: string): string[] {
  const out: string[] = [];
  const src = String(pattern ?? '');
  let itemStart = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  const pushItem = (raw: string) => {
    const s = String(raw ?? '').trim();
    if (!s) return;
    if (s.startsWith('...')) return;

    // Find first top-level ":" or "=" to isolate key part.
    let keyPart = s;
    let i = 0;
    let b = 0;
    let br = 0;
    let p = 0;
    while (i < s.length) {
      const ch = s[i];
      const next = s[i + 1];

      if (ch === '/' && next === '/') {
        // comment until end
        break;
      }
      if (ch === '/' && next === '*') {
        const end = s.indexOf('*/', i + 2);
        i = end === -1 ? s.length : end + 2;
        continue;
      }
      if (ch === "'" || ch === '"') {
        // skip strings inside default expressions
        let j = i + 1;
        while (j < s.length) {
          const c = s[j];
          if (c === '\\') {
            j += 2;
            continue;
          }
          j += 1;
          if (c === ch) break;
        }
        i = j;
        continue;
      }
      if (ch === '`') {
        // skip template literal (including ${} roughly by skipping to next backtick)
        let j = i + 1;
        while (j < s.length) {
          const c = s[j];
          if (c === '\\') {
            j += 2;
            continue;
          }
          j += 1;
          if (c === '`') break;
        }
        i = j;
        continue;
      }

      if (ch === '{') b += 1;
      else if (ch === '}') b -= 1;
      else if (ch === '[') br += 1;
      else if (ch === ']') br -= 1;
      else if (ch === '(') p += 1;
      else if (ch === ')') p -= 1;

      if (b === 0 && br === 0 && p === 0) {
        if (ch === ':') {
          keyPart = s.slice(0, i).trim();
          break;
        }
        if (ch === '=') {
          keyPart = s.slice(0, i).trim();
          break;
        }
      }

      i += 1;
    }

    if (!keyPart) return;
    if (keyPart.startsWith("'") || keyPart.startsWith('"')) {
      const q = keyPart[0] as "'" | '"';
      const parsed = readSimpleStringLiteralValue(keyPart, 0, q);
      if (parsed) out.push(parsed.value);
      return;
    }

    const m = keyPart.match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
    if (m) out.push(m[0]);
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      break;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = readQuotedString(src, i, ch);
      continue;
    }
    if (ch === '`') {
      i = readTemplateLiteral(src, i);
      continue;
    }

    if (ch === '{') braceDepth += 1;
    else if (ch === '}') braceDepth -= 1;
    else if (ch === '[') bracketDepth += 1;
    else if (ch === ']') bracketDepth -= 1;
    else if (ch === '(') parenDepth += 1;
    else if (ch === ')') parenDepth -= 1;

    if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && ch === ',') {
      pushItem(src.slice(itemStart, i));
      itemStart = i + 1;
    }

    i += 1;
  }
  pushItem(src.slice(itemStart));

  return out;
}

function extractUsedCtxLibKeys(code: string): string[] {
  if (!CTX_LIBS_MARKER_RE.test(code)) return [];
  const out = new Set<string>();

  const scanTemplateExpression = (start: number): number => {
    let i = start;
    let braceDepth = 1;
    while (i < code.length && braceDepth > 0) {
      const ch = code[i];
      const next = code[i + 1];
      if (ch === '/' && next === '/') {
        i = readLineComment(code, i);
        continue;
      }
      if (ch === '/' && next === '*') {
        i = readBlockComment(code, i);
        continue;
      }
      if (ch === "'" || ch === '"') {
        i = readQuotedString(code, i, ch);
        continue;
      }
      if (ch === '`') {
        i = scanTemplateLiteral(i + 1);
        continue;
      }

      const access = tryReadCtxLibAccess(code, i);
      if (access) {
        if (access.key) out.add(access.key);
        i = access.end;
        continue;
      }

      if (ch === '{') braceDepth += 1;
      else if (ch === '}') braceDepth -= 1;

      i += 1;
    }
    return i;
  };

  const scanTemplateLiteral = (start: number): number => {
    let i = start;
    while (i < code.length) {
      const ch = code[i];
      const next = code[i + 1];
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') return i + 1;
      if (ch === '$' && next === '{') {
        i = scanTemplateExpression(i + 2);
        continue;
      }
      i += 1;
    }
    return i;
  };

  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '/' && next === '/') {
      i = readLineComment(code, i);
      continue;
    }
    if (ch === '/' && next === '*') {
      i = readBlockComment(code, i);
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = readQuotedString(code, i, ch);
      continue;
    }
    if (ch === '`') {
      i = scanTemplateLiteral(i + 1);
      continue;
    }

    const access = tryReadCtxLibAccess(code, i);
    if (access) {
      if (access.key) out.add(access.key);
      i = access.end;
      continue;
    }

    // Destructuring: { a, b } = ctx.libs
    if (ch === '=' && next !== '=' && next !== '>' && next !== '<') {
      const right = skipSpaceAndCommentsForward(code, i + 1);
      const rhsBaseEnd = readsCtxLibsBase(code, right);
      if (rhsBaseEnd !== null) {
        const leftEnd = skipWhitespaceBackward(code, i - 1);
        if (code[leftEnd] === '}') {
          let depth = 0;
          let j = leftEnd;
          while (j >= 0) {
            const c = code[j];
            if (c === '}') depth += 1;
            else if (c === '{') {
              depth -= 1;
              if (depth === 0) break;
            }
            j -= 1;
          }
          if (j >= 0 && code[j] === '{') {
            const inner = code.slice(j + 1, leftEnd);
            for (const k of parseDestructuredKeysFromObjectPattern(inner)) out.add(k);
          }
        }
      }
    }

    i += 1;
  }

  return Array.from(out);
}

function injectEnsureLibsPreamble(code: string): string {
  if (!CTX_LIBS_MARKER_RE.test(code)) return code;
  if (ENSURE_LIBS_MARKER_RE.test(code)) return code;
  const keys = extractUsedCtxLibKeys(code);
  if (!keys.length) return code;
  return `/* __runjs_ensure_libs */\nawait ctx.__ensureLibs(${JSON.stringify(keys)});\n${code}`;
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
    if (!preprocessTemplates) return injectEnsureLibsPreamble(await compileRunJs(src));

    // 阶段 1：仅重写“裸”的 {{ ... }} 占位符，保持代码可解析（尤其是在 JSX 转换前）。
    const preBare = preprocessRunJsTemplates(src, { processStringLiterals: false });
    // 阶段 2：JSX -> JS。
    const jsxCompiled = await compileRunJs(preBare);
    // 阶段 3：对纯 JS 输出重写字符串/模板字面量（避免破坏 JSX 属性语法）。
    const out = preprocessRunJsTemplates(jsxCompiled, { processBarePlaceholders: false });
    // 阶段 4：为 ctx.libs 注入按需加载 preamble（保持用户同步访问语义）。
    return injectEnsureLibsPreamble(out);
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
