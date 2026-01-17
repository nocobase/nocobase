/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJs } from './jsxTransform';

export type PrepareRunJsCodeOptions = {
  /**
   * Enable runtime template compatibility:
   * - Replace legacy `{{ctx...}}` placeholders with values resolved at runtime.
   * - Supports placeholders inside string literals / template literals without injecting `await`
   *   into nested non-async function bodies (by hoisting resolution to the top-level).
   * - Skip processing inside explicit `ctx.resolveJsonTemplate(...)` calls
   */
  preprocessTemplates?: boolean;
};

const RESOLVE_JSON_TEMPLATE_CALL = 'ctx.resolveJsonTemplate';
const CTX_TEMPLATE_MARKER_RE = /\{\{\s*ctx(?:\.|\[|\?\.)/;
const STRINGIFY_HELPER_BASE_NAME = '__runjs_templateValueToString';
const BARE_PLACEHOLDER_VAR_RE = /\b__runjs_ctx_tpl_\d+\b/;
const STRINGIFY_HELPER_RE = /\b__runjs_templateValueToString(?:_\d+)?\b/;
const PREPROCESSED_MARKER_RE = /\b__runjs_ctx_tpl_\d+\b|\b__runjs_templateValueToString(?:_\d+)?\b/;

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

  // Avoid injecting `await` into nested functions by using a runtime (sync) stringify helper.
  // Keep legacy semantics where undefined values do not replace the template marker.
  let expr = token;
  for (const p of uniq) {
    const v = placeholderVar(p);
    expr = `(${expr}).split(${JSON.stringify(p)}).join(${stringifyHelperName}(${v}, ${JSON.stringify(p)}))`;
  }
  return expr;
}

/**
 * Preprocess RunJS source code to support legacy `{{ ... }}` placeholders at runtime.
 *
 * Important: This is NOT template resolution (no values are computed here).
 * It rewrites code into valid JS that calls `ctx.resolveJsonTemplate(...)` during execution.
 *
 * Design notes:
 * - To avoid syntax errors like "await is only valid in async functions", we hoist all template
 *   resolutions to the top-level of the RunJS program, then replace occurrences with variables.
 * - For string / template literals, we avoid wrapping with `await ...` in-place. Instead we keep
 *   the original literal expression and apply `.split().join()` replacements using a small helper
 *   that matches `resolveJsonTemplate`'s string replacement behavior for objects/undefined.
 */
export function preprocessRunJsTemplates(
  code: string,
  options: {
    processBarePlaceholders?: boolean;
    processStringLiterals?: boolean;
    skipIfAlreadyPreprocessed?: boolean;
  } = {},
): string {
  if (!CTX_TEMPLATE_MARKER_RE.test(code)) return code;
  const processBarePlaceholders = options.processBarePlaceholders !== false;
  const processStringLiterals = options.processStringLiterals !== false;
  const skipIfAlreadyPreprocessed = options.skipIfAlreadyPreprocessed !== false;
  // Avoid double-preprocessing (e.g. if a caller accidentally passes already-prepared code back into ctx.runjs).
  // This is a heuristic; these internal symbol names are intentionally unlikely to collide with user code.
  if (skipIfAlreadyPreprocessed) {
    if (processBarePlaceholders && processStringLiterals && PREPROCESSED_MARKER_RE.test(code)) return code;
    if (processBarePlaceholders && !processStringLiterals && BARE_PLACEHOLDER_VAR_RE.test(code)) return code;
    if (!processBarePlaceholders && processStringLiterals && STRINGIFY_HELPER_RE.test(code)) return code;
  }

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

  // Skip processing inside explicit `ctx.resolveJsonTemplate(...)` calls.
  let resolveCallPending = false;
  let resolveParenDepth = 0;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    // Comments (always preserved; no transformations inside)
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

    // Strings / template literals (optionally transformed, but never inside resolveJsonTemplate call)
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

    // Track `ctx.resolveJsonTemplate(` call regions
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
      // Not a call; reset and re-process current char normally
      resolveCallPending = false;
      continue;
    }

    // While inside resolveJsonTemplate(...), only track parentheses and output raw
    if (resolveParenDepth > 0) {
      if (ch === '(') resolveParenDepth += 1;
      else if (ch === ')') resolveParenDepth -= 1;
      out += ch;
      i += 1;
      continue;
    }

    if (processBarePlaceholders) {
      // Bare {{ ... }} placeholders -> runtime await resolveJsonTemplate("{{...}}")
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
 * Prepare user RunJS source code for execution.
 * - Optional runtime template compatibility rewrite
 * - JSX transform (sucrase) so RunJS can use JSX safely
 */
export async function prepareRunJsCode(code: string, options: PrepareRunJsCodeOptions = {}): Promise<string> {
  const src = typeof code === 'string' ? code : String(code ?? '');
  if (!options.preprocessTemplates) return await compileRunJs(src);

  // Phase 1: only rewrite *bare* {{ ... }} placeholders to keep code parsable (esp. before JSX transform).
  const preBare = preprocessRunJsTemplates(src, { processStringLiterals: false });
  // Phase 2: JSX -> JS.
  const jsxCompiled = await compileRunJs(preBare);
  // Phase 3: rewrite string/template literals on plain JS output (avoid breaking JSX attribute syntax).
  return preprocessRunJsTemplates(jsxCompiled, { processBarePlaceholders: false });
}
