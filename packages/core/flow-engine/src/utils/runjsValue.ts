/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSValue = {
  code: string;
  version?: string;
};

const RUNJS_ALLOWED_KEYS = new Set(['code', 'version']);

/**
 * Strictly detect RunJSValue to avoid conflicting with normal constant objects.
 * - MUST be a plain object (not array)
 * - MUST include string `code`
 * - MAY include string `version`
 * - MUST NOT include any other enumerable keys
 */
export function isRunJSValue(value: any): value is RunJSValue {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (!keys.includes('code')) return false;
  if (typeof (value as any).code !== 'string') return false;
  if ('version' in value && (value as any).version != null && typeof (value as any).version !== 'string') return false;
  for (const k of keys) {
    if (!RUNJS_ALLOWED_KEYS.has(k)) return false;
  }
  return true;
}

export function normalizeRunJSValue(value: RunJSValue): Required<RunJSValue> {
  return {
    code: String(value?.code ?? ''),
    version: String(value?.version ?? 'v1'),
  };
}

function stripStringsAndComments(code: string): string {
  // Keep template literals untouched (may include ${} expressions).
  let out = '';
  let state: 'code' | 'single' | 'double' | 'line' | 'block' = 'code';
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : '';

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        out += '  ';
        i++;
        state = 'line';
        continue;
      }
      if (ch === '/' && next === '*') {
        out += '  ';
        i++;
        state = 'block';
        continue;
      }
      if (ch === "'") {
        out += ' ';
        state = 'single';
        continue;
      }
      if (ch === '"') {
        out += ' ';
        state = 'double';
        continue;
      }
      out += ch;
      continue;
    }

    if (state === 'line') {
      if (ch === '\n') {
        out += '\n';
        state = 'code';
      } else {
        out += ' ';
      }
      continue;
    }

    if (state === 'block') {
      if (ch === '*' && next === '/') {
        out += '  ';
        i++;
        state = 'code';
      } else {
        out += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (state === 'single') {
      if (ch === '\\') {
        out += '  ';
        i++;
        continue;
      }
      if (ch === "'") {
        out += ' ';
        state = 'code';
      } else {
        out += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }

    // state === 'double'
    if (ch === '\\') {
      out += '  ';
      i++;
      continue;
    }
    if (ch === '"') {
      out += ' ';
      state = 'code';
    } else {
      out += ch === '\n' ? '\n' : ' ';
    }
  }
  return out;
}

function stripComments(code: string): string {
  let out = '';
  let state: 'code' | 'single' | 'double' | 'line' | 'block' = 'code';
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : '';

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        out += '  ';
        i++;
        state = 'line';
        continue;
      }
      if (ch === '/' && next === '*') {
        out += '  ';
        i++;
        state = 'block';
        continue;
      }
      if (ch === "'") {
        out += ch;
        state = 'single';
        continue;
      }
      if (ch === '"') {
        out += ch;
        state = 'double';
        continue;
      }
      out += ch;
      continue;
    }

    if (state === 'line') {
      if (ch === '\n') {
        out += '\n';
        state = 'code';
      } else {
        out += ' ';
      }
      continue;
    }

    if (state === 'block') {
      if (ch === '*' && next === '/') {
        out += '  ';
        i++;
        state = 'code';
      } else {
        out += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (state === 'single') {
      out += ch;
      if (ch === '\\') {
        const nextCh = i + 1 < code.length ? code[i + 1] : '';
        if (nextCh) {
          out += nextCh;
          i++;
        }
        continue;
      }
      if (ch === "'") {
        state = 'code';
      }
      continue;
    }

    // state === 'double'
    out += ch;
    if (ch === '\\') {
      const nextCh = i + 1 < code.length ? code[i + 1] : '';
      if (nextCh) {
        out += nextCh;
        i++;
      }
      continue;
    }
    if (ch === '"') {
      state = 'code';
    }
  }
  return out;
}

function normalizeSubPath(raw: string): { subPath: string; wildcard: boolean } {
  if (!raw) return { subPath: '', wildcard: false };
  let s = raw;
  // Convert simple string literal keys: ['a'] / ["a"] -> .a
  s = s.replace(/\[['"]([a-zA-Z_$][a-zA-Z0-9_$]*)['"]\]/g, '.$1');

  // Any remaining bracket access with non-numeric content is considered dynamic -> wildcard.
  const bracketRe = /\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = bracketRe.exec(s))) {
    const inner = String(m[1] ?? '').trim();
    if (/^\d+$/.test(inner)) continue;
    if (/^['"][a-zA-Z_$][a-zA-Z0-9_$]*['"]$/.test(inner)) continue;
    return { subPath: s.startsWith('.') ? s.slice(1) : s, wildcard: true };
  }

  if (s.startsWith('.')) s = s.slice(1);
  return { subPath: s, wildcard: false };
}

/**
 * Heuristic extraction of ctx variable usage from RunJS code.
 *
 * Returns a map: varName -> string[] subPaths
 * - subPath '' means the variable root is used (or dependency is dynamic), caller MAY treat it as wildcard.
 * - Only best-effort parsing; correctness prefers over-approximation.
 */
export function extractUsedVariablePathsFromRunJS(code: string): Record<string, string[]> {
  if (typeof code !== 'string' || !code.trim()) return {};
  const src = stripStringsAndComments(code);
  const srcWithStrings = stripComments(code);
  const usage = new Map<string, Set<string>>();

  const add = (varName: string, subPath: string) => {
    if (!varName) return;
    const set = usage.get(varName) || new Set<string>();
    set.add(subPath || '');
    usage.set(varName, set);
  };

  // dot form: ctx.foo.bar / ctx.foo[0].bar (excluding ctx.method(...))
  const dotRe = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*(?:(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)|(?:\[[^\]]+\]))*)(?!\s*\()/g;
  let match: RegExpExecArray | null;
  while ((match = dotRe.exec(src))) {
    const pathAfterCtx = match[1] || '';
    const firstKeyMatch = pathAfterCtx.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (!firstKeyMatch) continue;
    const firstKey = firstKeyMatch[1];
    const rest = pathAfterCtx.slice(firstKey.length);
    const { subPath, wildcard } = normalizeSubPath(rest);
    add(firstKey, wildcard ? '' : subPath);
  }

  // bracket root: ctx['foo'].bar / ctx["foo"][0] (excluding ctx['method'](...))
  const bracketRootRe =
    /ctx\s*\[\s*(['"])([a-zA-Z_$][a-zA-Z0-9_$]*)\1\s*\]((?:(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)|(?:\[[^\]]+\]))*)(?!\s*\()/g;
  while ((match = bracketRootRe.exec(srcWithStrings))) {
    const varName = match[2] || '';
    const rest = match[3] || '';
    const { subPath, wildcard } = normalizeSubPath(rest);
    add(varName, wildcard ? '' : subPath);
  }

  const out: Record<string, string[]> = {};
  for (const [k, set] of usage.entries()) {
    out[k] = Array.from(set);
  }
  return out;
}
