/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { linter, Diagnostic } from '@codemirror/lint';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
// acorn-walk 仅用于轻量遍历做一些静态启发式检查（非类型检查）
// 类型定义可缺省，因此用 any 兼容
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as acornWalk from 'acorn-walk';

/**
 * 创建 JavaScript 语法检查器 - 只检查语法错误
 */
interface AcornError extends Error {
  loc?: {
    line: number;
    column: number;
  };
  pos?: number;
}

export const computeDiagnosticsFromText = (
  text: string,
  options?: {
    /**
     * When provided, treat `ctx.<name>` / `ctx.<name>()` where `<name>` is NOT in this list as a lint issue.
     * This enables context-aware unknown ctx API detection in CodeEditor (best-effort).
     */
    knownCtxMemberRoots?: Iterable<string>;
  },
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];

  if (!text.trim()) return diagnostics;

  // 简单策略：
  // - 若某行包含 `{{ ctx.* }}`（或未闭合的 `{{ ctx.*`），则忽略该行的所有诊断
  const lines = text.split('\n');
  const ignoredLines = new Set<number>(); // 0-based 行号
  const mustacheCtxClosed = /\{\{[^}]*ctx[^}]*\}\}/; // 同行内闭合
  const mustacheCtxOpen = /\{\{[^}]*ctx[^}]*$/; // 未闭合，行尾结束
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (mustacheCtxClosed.test(line) || mustacheCtxOpen.test(line)) {
      ignoredLines.add(i);
    }
  }

  // 预计算每行起始偏移，用于 from/to -> 行号 映射
  const lineStarts: number[] = [0];
  for (let i = 1; i < lines.length; i++) {
    lineStarts[i] = lineStarts[i - 1] + lines[i - 1].length + 1; // +1 for \n
  }
  const posToLine = (pos: number) => {
    // 二分查找 pos 所在行（0-based）
    let lo = 0;
    let hi = lineStarts.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lineStarts[mid] <= pos) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  };
  const isIgnoredPos = (pos: number) => ignoredLines.has(posToLine(pos));

  const scanUnknownCtxDiagnostics = (): Diagnostic[] => {
    const RULE_CTX_CALL = 'possible-undefined-ctx-member-call';
    const RULE_CTX_MEMBER = 'possible-unknown-ctx-member';
    const knownCtxRoots = options?.knownCtxMemberRoots ? new Set(Array.from(options.knownCtxMemberRoots)) : null;
    // Always allow some well-known ctx roots to avoid noisy false positives when doc is incomplete.
    for (const k of ['t', 'logger', 'libs']) knownCtxRoots?.add(k);
    const allowedShort = new Set<string>(['t']);

    const result: Diagnostic[] = [];
    const reported = new Set<string>();
    const push = (from: number, to: number, source: string, message: string) => {
      if (isIgnoredPos(from)) return;
      const key = `${source}@${from}`;
      if (reported.has(key)) return;
      reported.add(key);
      result.push({
        from,
        to: Math.max(from + 1, to),
        severity: 'warning',
        source,
        message,
        actions: [],
      });
    };

    const src = text;
    const len = src.length;
    const isIdentStart = (ch: string) => {
      if (!ch) return false;
      const c = ch.charCodeAt(0);
      return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36;
    };
    const isIdentPart = (ch: string) => {
      if (!ch) return false;
      const c = ch.charCodeAt(0);
      return isIdentStart(ch) || (c >= 48 && c <= 57);
    };

    let state: 'code' | 'single' | 'double' | 'template' | 'lineComment' | 'blockComment' = 'code';
    for (let i = 0; i < len; i++) {
      const ch = src[i];
      const next = i + 1 < len ? src[i + 1] : '';

      if (state === 'lineComment') {
        if (ch === '\n') state = 'code';
        continue;
      }
      if (state === 'blockComment') {
        if (ch === '*' && next === '/') {
          state = 'code';
          i += 1;
        }
        continue;
      }
      if (state === 'single') {
        if (ch === '\\') {
          i += 1;
          continue;
        }
        if (ch === "'") state = 'code';
        continue;
      }
      if (state === 'double') {
        if (ch === '\\') {
          i += 1;
          continue;
        }
        if (ch === '"') state = 'code';
        continue;
      }
      if (state === 'template') {
        if (ch === '\\') {
          i += 1;
          continue;
        }
        if (ch === '`') state = 'code';
        continue;
      }

      // code state
      if (ch === '/' && next === '/') {
        state = 'lineComment';
        i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        state = 'blockComment';
        i += 1;
        continue;
      }
      if (ch === "'") {
        state = 'single';
        continue;
      }
      if (ch === '"') {
        state = 'double';
        continue;
      }
      if (ch === '`') {
        state = 'template';
        continue;
      }

      if (ch !== 'c') continue;
      if (src.slice(i, i + 3) !== 'ctx') continue;

      const before = i > 0 ? src[i - 1] : '';
      const after = i + 3 < len ? src[i + 3] : '';
      if (before === '.') continue; // avoid obj.ctx.* false positives
      if (before && isIdentPart(before)) continue;
      if (after && isIdentPart(after)) continue;

      let j = i + 3;
      while (j < len && /\s/.test(src[j])) j++;

      // optional chain: ctx?.foo / ctx?.['foo']
      let optionalChaining = false;
      if (src[j] === '?' && src[j + 1] === '.') {
        optionalChaining = true;
        j += 2;
      }

      let access: 'dot' | 'bracket' | null = null;
      if (optionalChaining) {
        access = src[j] === '[' ? 'bracket' : 'dot';
      } else {
        if (src[j] === '.') {
          access = 'dot';
          j += 1;
        } else if (src[j] === '[') {
          access = 'bracket';
        } else {
          continue;
        }
      }

      while (j < len && /\s/.test(src[j])) j++;

      let name = '';
      let from = 0;
      let to = 0;

      if (access === 'dot') {
        if (!isIdentStart(src[j] || '')) continue;
        from = j;
        j += 1;
        while (j < len && isIdentPart(src[j] || '')) j++;
        to = j;
        name = src.slice(from, to);
      } else {
        // bracket: only support string literal key to reduce false positives
        if (src[j] !== '[') continue;
        j += 1;
        while (j < len && /\s/.test(src[j])) j++;
        const quote = src[j];
        if (quote !== "'" && quote !== '"') continue;
        j += 1;
        from = j;
        while (j < len) {
          const c = src[j];
          if (c === '\\') {
            j += 2;
            continue;
          }
          if (c === quote) break;
          j += 1;
        }
        to = j;
        name = src.slice(from, to);
        if (src[j] !== quote) continue;
        j += 1;
        while (j < len && /\s/.test(src[j])) j++;
        if (src[j] !== ']') continue;
        j += 1;
      }

      if (!name) continue;

      let k = j;
      while (k < len && /\s/.test(src[k])) k++;
      // optional call: ctx.foo?.()
      if (src[k] === '?' && src[k + 1] === '.') k += 2;
      while (k < len && /\s/.test(src[k])) k++;
      const isCall = src[k] === '(';

      if (knownCtxRoots) {
        if (!knownCtxRoots.has(name)) {
          if (isCall) {
            push(
              from,
              to,
              RULE_CTX_CALL,
              `Possible undefined ctx method call: ctx.${name}(). 可能是拼写错误或未在当前 ctx API 中定义。`,
            );
          } else {
            push(
              from,
              to,
              RULE_CTX_MEMBER,
              `Possible unknown ctx member access: ctx.${name}. 可能是拼写错误或未在当前 ctx API 中定义。`,
            );
          }
        }
      } else {
        // Without an explicit ctx API list, only keep conservative short-name method call warnings.
        if (isCall && name.length <= 2 && !allowedShort.has(name)) {
          push(
            from,
            to,
            RULE_CTX_CALL,
            `Possible undefined ctx method call: ctx.${name}(). 可能是拼写错误或未在当前 ctx API 中定义。`,
          );
        }
      }

      i = Math.max(i, j - 1);
    }

    return result;
  };

  const scanNonCallableCallDiagnostics = (): Diagnostic[] => {
    const RULE_NONCALLABLE_CALL = 'no-noncallable-call';
    const result: Diagnostic[] = [];
    const reported = new Set<string>();
    const push = (from: number, to: number) => {
      if (isIgnoredPos(from)) return;
      const key = `${from}-${to}`;
      if (reported.has(key)) return;
      reported.add(key);
      result.push({
        from,
        to: Math.max(from + 1, to),
        severity: 'warning',
        source: RULE_NONCALLABLE_CALL,
        message: 'This expression is not callable.',
        actions: [],
      });
    };

    const src = text;
    const len = src.length;
    const isIdentStart = (ch: string) => {
      if (!ch) return false;
      const c = ch.charCodeAt(0);
      return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36;
    };
    const isIdentPart = (ch: string) => {
      if (!ch) return false;
      const c = ch.charCodeAt(0);
      return isIdentStart(ch) || (c >= 48 && c <= 57);
    };

    const skipWS = (pos: number) => {
      let i = pos;
      while (i < len && /\s/.test(src[i])) i++;
      return i;
    };
    const hasCallStartAt = (pos: number) => {
      if (pos >= len) return false;
      if (src[pos] === '(') return true;
      return src[pos] === '?' && src[pos + 1] === '.' && src[pos + 2] === '(';
    };

    const findMatchingParen = (openAt: number): number => {
      let depth = 1;
      let state: 'code' | 'single' | 'double' | 'template' | 'lineComment' | 'blockComment' = 'code';
      for (let i = openAt + 1; i < len; i++) {
        const ch = src[i];
        const next = i + 1 < len ? src[i + 1] : '';

        if (state === 'lineComment') {
          if (ch === '\n') state = 'code';
          continue;
        }
        if (state === 'blockComment') {
          if (ch === '*' && next === '/') {
            state = 'code';
            i += 1;
          }
          continue;
        }
        if (state === 'single') {
          if (ch === '\\') {
            i += 1;
            continue;
          }
          if (ch === "'") state = 'code';
          continue;
        }
        if (state === 'double') {
          if (ch === '\\') {
            i += 1;
            continue;
          }
          if (ch === '"') state = 'code';
          continue;
        }
        if (state === 'template') {
          if (ch === '\\') {
            i += 1;
            continue;
          }
          if (ch === '`') state = 'code';
          continue;
        }

        // code state
        if (ch === '/' && next === '/') {
          state = 'lineComment';
          i += 1;
          continue;
        }
        if (ch === '/' && next === '*') {
          state = 'blockComment';
          i += 1;
          continue;
        }
        if (ch === "'") {
          state = 'single';
          continue;
        }
        if (ch === '"') {
          state = 'double';
          continue;
        }
        if (ch === '`') {
          state = 'template';
          continue;
        }

        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) return i;
        }
      }
      return -1;
    };

    const isKeywordLiteral = (word: string) => word === 'true' || word === 'false' || word === 'null';

    let state: 'code' | 'lineComment' | 'blockComment' = 'code';
    for (let i = 0; i < len; i++) {
      const ch = src[i];
      const next = i + 1 < len ? src[i + 1] : '';

      if (state === 'lineComment') {
        if (ch === '\n') state = 'code';
        continue;
      }
      if (state === 'blockComment') {
        if (ch === '*' && next === '/') {
          state = 'code';
          i += 1;
        }
        continue;
      }

      // code state
      if (ch === '/' && next === '/') {
        state = 'lineComment';
        i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        state = 'blockComment';
        i += 1;
        continue;
      }

      if (ch === "'" || ch === '"') {
        // parse string literal and see if it is directly called: 'x'()
        const quote = ch;
        const start = i;
        i += 1;
        while (i < len) {
          const c = src[i];
          if (c === '\\') {
            i += 2;
            continue;
          }
          if (c === quote) break;
          i += 1;
        }
        const end = Math.min(len, i + 1);
        const after = skipWS(end);
        if (hasCallStartAt(after)) push(start, end);
        continue;
      }

      if (ch === '`') {
        // parse template literal (best-effort) and see if it is directly called: `x`()
        const start = i;
        i += 1;
        while (i < len) {
          const c = src[i];
          if (c === '\\') {
            i += 2;
            continue;
          }
          if (c === '`') break;
          i += 1;
        }
        const end = Math.min(len, i + 1);
        const after = skipWS(end);
        if (hasCallStartAt(after)) push(start, end);
        continue;
      }

      if (ch >= '0' && ch <= '9') {
        // parse number literal and see if it is directly called: 123()
        const start = i;
        i += 1;
        while (i < len && src[i] >= '0' && src[i] <= '9') i++;
        if (src[i] === '.') {
          i += 1;
          while (i < len && src[i] >= '0' && src[i] <= '9') i++;
        }
        if (src[i] === 'e' || src[i] === 'E') {
          const sign = src[i + 1];
          let k = i + 1;
          if (sign === '+' || sign === '-') k += 1;
          if (src[k] >= '0' && src[k] <= '9') {
            i = k + 1;
            while (i < len && src[i] >= '0' && src[i] <= '9') i++;
          }
        }
        if (src[i] === 'n') i += 1; // bigint
        const end = i;
        const after = skipWS(end);
        if (hasCallStartAt(after)) push(start, end);
        i = end - 1;
        continue;
      }

      if (isIdentStart(ch)) {
        const start = i;
        i += 1;
        while (i < len && isIdentPart(src[i])) i++;
        const word = src.slice(start, i);
        if (isKeywordLiteral(word)) {
          const after = skipWS(i);
          if (hasCallStartAt(after)) push(start, i);
        }
        i -= 1;
        continue;
      }

      if (ch === '(') {
        let inner = skipWS(i + 1);
        let innerFrom = inner;
        let candidate = false;
        if (src[inner] === '+' || src[inner] === '-') {
          innerFrom = inner;
          inner = skipWS(inner + 1);
        }
        const first = src[inner];
        if (first === '{' || first === '[' || first === "'" || first === '"' || first === '`') {
          candidate = true;
        } else if (first >= '0' && first <= '9') {
          candidate = true;
        } else if (isIdentStart(first)) {
          let j = inner + 1;
          while (j < len && isIdentPart(src[j])) j++;
          const word = src.slice(inner, j);
          if (isKeywordLiteral(word)) candidate = true;
        }

        if (candidate) {
          const close = findMatchingParen(i);
          if (close > i) {
            const after = skipWS(close + 1);
            if (hasCallStartAt(after)) {
              push(innerFrom, close);
            }
          }
        }
      }
    }

    return result;
  };

  let ast: any = null;
  try {
    // 使用 acorn + jsx 插件解析代码（支持 JSX），只检查语法错误
    const Parser: any = acorn.Parser || acorn;
    const ParserWithJSX = typeof jsx === 'function' ? Parser.extend(jsx()) : Parser;
    ast = ParserWithJSX.parse(text, {
      ecmaVersion: 2022,
      sourceType: 'script',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      locations: true,
    });
  } catch (error) {
    const acornError = error as AcornError;
    // 语法错误
    let from = 0;
    let to = text.length;

    // 尝试解析位置信息
    if (acornError.loc) {
      const textLines = text.split('\n');
      from =
        textLines.slice(0, acornError.loc.line - 1).join('\n').length +
        (acornError.loc.line > 1 ? 1 : 0) +
        acornError.loc.column;
      to = from + 1;
    } else if (acornError.pos !== undefined) {
      from = acornError.pos;
      to = from + 1;
    }

    // 若错误位置所在行包含模板变量，忽略该错误
    if (!isIgnoredPos(from)) {
      diagnostics.push({
        from,
        to,
        severity: 'error',
        message: `Syntax error: ${acornError.message}`,
        actions: [],
      });
    }

    // 语法错误时依然尽量输出 ctx API 的启发式 warning（避免 “有 error 时 warning 全丢失”）。
    diagnostics.push(...scanUnknownCtxDiagnostics());
    diagnostics.push(...scanNonCallableCallDiagnostics());
    return diagnostics;
  }

  // 非语法层的小启发式检查（可开可关，尽量减少误报）
  try {
    const push = (from: number, to: number, msg: string, severity: Diagnostic['severity'] = 'warning') => {
      if (isIgnoredPos(from)) return;
      diagnostics.push({ from, to, message: msg, severity, actions: [] });
    };

    const declared = new Set<string>([
      // 常见全局（简表）
      'ctx',
      'console',
      'window',
      'navigator',
      'document',
      'Math',
      'Date',
      'Array',
      'Object',
      'Number',
      'String',
      'Boolean',
      'Promise',
      'RegExp',
      'Set',
      'Map',
      'WeakSet',
      'WeakMap',
      'JSON',
      'Intl',
      'URL',
      'Blob',
      'Error',
      'TypeError',
      'encodeURIComponent',
      'decodeURIComponent',
      'parseInt',
      'parseFloat',
      'isNaN',
      'isFinite',
      'undefined',
      'NaN',
      'Infinity',
    ]);

    const addId = (id: any) => {
      if (id && typeof id.name === 'string') declared.add(id.name);
    };
    const addPatternIds = (pattern: any) => {
      // 支持简单模式：Identifier / ArrayPattern / ObjectPattern
      if (!pattern) return;
      const stack: any[] = [pattern];
      while (stack.length) {
        const node = stack.pop();
        if (!node) continue;
        if (node.type === 'Identifier') addId(node);
        else if (node.type === 'AssignmentPattern') stack.push(node.left);
        else if (node.type === 'ArrayPattern') (node.elements || []).forEach((n: any) => n && stack.push(n));
        else if (node.type === 'ObjectPattern')
          (node.properties || []).forEach((p: any) => p && stack.push(p.value || p));
      }
    };

    // 收集顶层声明（以及函数/参数名，粗粒度，尽量避免误报）
    // 使用 full 方式更兼容，避免对特定 walker 键的依赖（如 VariableDeclarator 在某些打包环境下不可用）
    acornWalk.full(ast, (node: any) => {
      switch (node?.type) {
        case 'VariableDeclarator':
          addPatternIds(node.id);
          break;
        case 'FunctionDeclaration':
          addId(node.id);
          (node.params || []).forEach(addPatternIds);
          break;
        case 'FunctionExpression':
          // 具名函数表达式也记录 id
          addId(node.id);
          (node.params || []).forEach(addPatternIds);
          break;
        case 'ArrowFunctionExpression':
          (node.params || []).forEach(addPatternIds);
          break;
        case 'CatchClause':
          addPatternIds((node as any).param);
          break;
        case 'ClassDeclaration':
          addId(node.id);
          break;
        default:
          break;
      }
    });

    // 1) 明显不可调用的调用表达式：如 123()、'x'()、(1+2)()
    acornWalk.full(ast, (node: any) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        const isCallableLike =
          callee &&
          (callee.type === 'Identifier' ||
            callee.type === 'MemberExpression' ||
            callee.type === 'FunctionExpression' ||
            callee.type === 'ArrowFunctionExpression' ||
            callee.type === 'CallExpression' ||
            callee.type === 'ChainExpression');
        if (!isCallableLike) {
          const from = (callee?.loc && (callee as any).start) ?? node.start;
          const to = (callee?.loc && (callee as any).end) ?? node.end;
          if (isIgnoredPos(from)) return;
          diagnostics.push({
            from,
            to,
            severity: 'warning',
            source: 'no-noncallable-call',
            message: 'This expression is not callable.',
            actions: [],
          });
        }
      } else if (node.type === 'NewExpression') {
        const callee = node.callee;
        const isConstructorLike =
          callee &&
          (callee.type === 'Identifier' || callee.type === 'MemberExpression' || callee.type === 'CallExpression');
        if (!isConstructorLike) {
          const from = (callee?.loc && (callee as any).start) ?? node.start;
          const to = (callee?.loc && (callee as any).end) ?? node.end;
          push(from, to, 'This constructor is not a function.');
        }
      }
    });

    // 1.1) 可疑的 ctx 方法调用：ctx.xxx()
    // - 当传入 knownCtxMemberRoots 时：对所有“不在已知 ctx API 列表中”的调用给出提示
    // - 当未传入时：保守策略，仅对属性名长度 <= 2 的调用给出提示，减少误报
    try {
      const RULE_CTX_CALL = 'possible-undefined-ctx-member-call';
      const RULE_CTX_MEMBER = 'possible-unknown-ctx-member';
      const reportedCtxCalls = new Set<string>();
      const knownCtxRoots = options?.knownCtxMemberRoots ? new Set(Array.from(options.knownCtxMemberRoots)) : null;
      // Always allow some well-known ctx roots to avoid noisy false positives when doc is incomplete.
      for (const k of ['t', 'logger', 'libs']) knownCtxRoots?.add(k);
      const allowedShort = new Set<string>(['t']);
      acornWalk.full(ast, (node: any) => {
        if (!node || typeof node.type !== 'string') return;
        if (node.type !== 'CallExpression') return;
        let callee = node.callee;
        if (callee?.type === 'ChainExpression') callee = callee.expression;
        if (!callee || callee.type !== 'MemberExpression') return;
        const obj = callee.object;
        if (!obj || obj.type !== 'Identifier' || obj.name !== 'ctx') return;

        let name: string | null = null;
        if (!callee.computed && callee.property?.type === 'Identifier') name = callee.property.name;
        else if (callee.computed && callee.property?.type === 'Literal' && typeof callee.property.value === 'string')
          name = callee.property.value;
        if (!name) return;
        const normalized = String(name).trim();
        if (!normalized || normalized.startsWith('_')) return;
        if (knownCtxRoots) {
          if (knownCtxRoots.has(normalized)) return;
        } else {
          if (normalized.length > 2) return;
          if (allowedShort.has(normalized)) return;
        }

        const from = (callee.property as any)?.start ?? callee.start ?? node.start;
        const to = (callee.property as any)?.end ?? from + 1;
        const key = `${normalized}@${from}`;
        if (reportedCtxCalls.has(key)) return;
        if (isIgnoredPos(from)) return;
        diagnostics.push({
          from,
          to,
          severity: 'warning',
          source: RULE_CTX_CALL,
          message: `Possible undefined ctx method call: ctx.${normalized}(). 可能是拼写错误或未在当前 ctx API 中定义。`,
          actions: [],
        });
        reportedCtxCalls.add(key);
      });

      // 1.2) 可疑的 ctx 成员访问：ctx.xxx（包含 ctx.xxx.yyy 的 root 访问）
      // 规则与方法调用保持一致，但会跳过 CallExpression.callee 的 member（避免与 1.1 重复）。
      const reportedCtxMembers = new Set<string>();
      acornWalk.ancestor(ast, {
        MemberExpression(node: any, ancestors: any[]) {
          // Only enable unknown-member detection when we have an explicit ctx API list;
          // otherwise the false-positive rate is too high for plain member access.
          if (!knownCtxRoots) return;

          const parent = ancestors[ancestors.length - 2];
          if (parent?.type === 'CallExpression') {
            let callee = parent.callee;
            if (callee?.type === 'ChainExpression') callee = callee.expression;
            if (callee === node) return; // handled by call rule above
          }

          const obj = node?.object;
          if (!obj || obj.type !== 'Identifier' || obj.name !== 'ctx') return;

          let name: string | null = null;
          if (!node.computed && node.property?.type === 'Identifier') name = node.property.name;
          else if (node.computed && node.property?.type === 'Literal' && typeof node.property.value === 'string')
            name = node.property.value;
          if (!name) return;
          const normalized = String(name).trim();
          if (!normalized || normalized.startsWith('_')) return;
          if (knownCtxRoots.has(normalized)) return;

          const from = (node.property as any)?.start ?? node.start ?? 0;
          const to = (node.property as any)?.end ?? from + 1;
          const key = `${normalized}@${from}`;
          if (reportedCtxMembers.has(key)) return;
          if (isIgnoredPos(from)) return;

          diagnostics.push({
            from,
            to,
            severity: 'warning',
            source: RULE_CTX_MEMBER,
            message: `Possible unknown ctx member access: ctx.${normalized}. 可能是拼写错误或未在当前 ctx API 中定义。`,
            actions: [],
          });
          reportedCtxMembers.add(key);
        },
      });
    } catch (_) {
      // ignore
    }

    // 2) 疑似未定义变量（尽量减少误报：排除属性名与解构/声明）
    const reported = new Set<string>();
    acornWalk.ancestor(ast, {
      Identifier(node: any, ancestors: any[]) {
        const name = node.name;
        if (!name || declared.has(name) || reported.has(name)) return;
        const parent = ancestors[ancestors.length - 2];
        if (!parent) return;
        // 跳过声明位置 / 属性键 / 非计算属性
        if (
          (parent.type === 'VariableDeclarator' && parent.id === node) ||
          (parent.type === 'FunctionDeclaration' && parent.id === node) ||
          (parent.type === 'FunctionExpression' && parent.id === node) ||
          (parent.type === 'ClassDeclaration' && parent.id === node) ||
          (parent.type === 'ClassExpression' && parent.id === node) ||
          (parent.type === 'Property' && parent.key === node && parent.computed !== true) ||
          (parent.type === 'MemberExpression' && parent.property === node && parent.computed !== true) ||
          (parent.type === 'LabeledStatement' && parent.label === node) ||
          (parent.type === 'BreakStatement' && parent.label === node) ||
          (parent.type === 'ContinueStatement' && parent.label === node)
        ) {
          return;
        }
        // 可能未定义的自由变量
        const from = (node as any).start ?? 0;
        const to = (node as any).end ?? from + 1;
        push(from, to, `Possible undefined variable: ${name}`, 'warning');
        reported.add(name);
      },
    });
  } catch (e) {
    // 静态检查失败不影响编辑体验
    // console.debug('[linter] static checks failed', e);
  }

  return diagnostics;
};

export const createJavaScriptLinter = (options?: { knownCtxMemberRoots?: Iterable<string> }) => {
  return linter((view) => {
    const text = view.state.doc.toString();
    return computeDiagnosticsFromText(text, options);
  });
};
