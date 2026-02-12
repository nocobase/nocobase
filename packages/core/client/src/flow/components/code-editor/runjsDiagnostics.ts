/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { javascript } from '@codemirror/lang-javascript';
import { Text } from '@codemirror/state';
import type { TreeCursor } from '@lezer/common';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
// acorn-walk is only used for lightweight AST traversal in heuristic checks (not type-checking).
// Its types can be absent in some environments, so we keep it as any-friendly.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as acornWalk from 'acorn-walk';
import {
  JSRunner,
  FlowContext,
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  prepareRunJsCode,
} from '@nocobase/flow-engine';

export type RunJSIssue = {
  type: 'lint' | 'runtime';
  message: string;
  ruleId?: string;
  location?: {
    start?: { line: number; column: number };
  };
  stack?: string;
};

export type RunJSLog = {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
};

export type DiagnoseRunJSResult = {
  issues: RunJSIssue[];
  logs: RunJSLog[];
  execution?: {
    started: boolean;
    finished: boolean;
    timeout: boolean;
    durationMs?: number;
  };
};

export type PreviewRunJSResult = {
  success: boolean;
  message: string;
};

export const MAX_MESSAGE_CHARS = 4000;
const PREVIEW_TIMEOUT_MS = 5000;
const MAX_STACK_CHARS = 1600;
const MAX_STACK_FRAMES = 1;

const JS_PARSER = javascript({ jsx: true }).language.parser;

const mustacheCtxClosed = /\{\{[^}]*ctx[^}]*\}\}/;
const mustacheCtxOpen = /\{\{[^}]*ctx[^}]*$/;

function safeToString(value: any): string {
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (value instanceof Error) return value.message || String(value);
    return JSON.stringify(value);
  } catch (_) {
    try {
      return String(value);
    } catch {
      return '[Unstringifiable]';
    }
  }
}

function shortenMiddle(text: string, maxChars: number): string {
  const src = String(text || '');
  if (src.length <= maxChars) return src;
  if (maxChars <= 3) return src.slice(0, maxChars);
  const head = Math.floor((maxChars - 3) / 2);
  const tail = maxChars - 3 - head;
  return `${src.slice(0, head)}...${src.slice(-tail)}`;
}

function shortenStackUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const fileName = pathname.split('/').filter(Boolean).pop() || pathname || 'bundle.js';
    return `${parsed.origin}/.../${shortenMiddle(fileName, 80)}`;
  } catch {
    return shortenMiddle(url, 120);
  }
}

function normalizeStackLine(line: string): string {
  let out = String(line || '').trimEnd();
  out = out.replace(/https?:\/\/[^\s)]+/g, (m) => shortenStackUrl(m));
  for (let i = 0; i < 4; i++) {
    const next = out.replace(/eval at [^()]*\(/g, 'eval(');
    if (next === out) break;
    out = next;
  }
  out = out.replace(/\(\s*eval\s*\(/g, '(eval(');
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function simplifyStack(raw: string, maxFrames = MAX_STACK_FRAMES): string {
  const lines = String(raw || '')
    .split('\n')
    .map((line) => normalizeStackLine(line))
    .filter((line) => !!line);

  if (!lines.length) return '';

  const head = lines[0];
  const frameLines = lines.slice(1);
  const dedupedFrames: string[] = [];
  for (const frame of frameLines) {
    if (!frame) continue;
    if (dedupedFrames.length > 0 && dedupedFrames[dedupedFrames.length - 1] === frame) continue;
    dedupedFrames.push(frame);
  }

  const visible = dedupedFrames.slice(0, Math.max(0, maxFrames));
  const omitted = Math.max(0, dedupedFrames.length - visible.length);
  const output = [head, ...visible];
  if (omitted > 0) output.push(`... (${omitted} frames omitted)`);
  return output.join('\n');
}

function safeStack(err: any, maxChars = MAX_STACK_CHARS): string | undefined {
  const raw = err?.stack ? String(err.stack) : '';
  if (!raw) return undefined;
  const simplified = simplifyStack(raw);
  if (simplified.length <= maxChars) return simplified;
  return `${simplified.slice(0, Math.max(0, maxChars - 16))}\n... (stack truncated)`;
}

function createIgnoredPosChecker(code: string): (pos: number) => boolean {
  const lines = String(code || '').split('\n');
  const ignoredLines = new Set<number>(); // 0-based
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (mustacheCtxClosed.test(line) || mustacheCtxOpen.test(line)) ignoredLines.add(i);
  }
  if (ignoredLines.size === 0) return () => false;

  const lineStarts: number[] = [0];
  for (let i = 1; i < lines.length; i++) {
    lineStarts[i] = lineStarts[i - 1] + lines[i - 1].length + 1;
  }
  const posToLine = (pos: number) => {
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

  return (pos: number) => ignoredLines.has(posToLine(pos));
}

function posToLineColumn(text: Text, pos: number): { line: number; column: number } {
  const p = Math.max(0, Math.min(text.length, Math.floor(pos)));
  const line = text.lineAt(p);
  return { line: line.number, column: p - line.from + 1 };
}

function sortIssuesStable(issues: RunJSIssue[]): RunJSIssue[] {
  return [...issues].sort((a, b) => {
    const ta = a.type === 'lint' ? 0 : 1;
    const tb = b.type === 'lint' ? 0 : 1;
    if (ta !== tb) return ta - tb;
    const la = a.location?.start?.line ?? Number.MAX_SAFE_INTEGER;
    const lb = b.location?.start?.line ?? Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;
    const ca = a.location?.start?.column ?? Number.MAX_SAFE_INTEGER;
    const cb = b.location?.start?.column ?? Number.MAX_SAFE_INTEGER;
    if (ca !== cb) return ca - cb;
    return String(a.ruleId || '').localeCompare(String(b.ruleId || ''));
  });
}

function sortLogsStable(logs: RunJSLog[]): RunJSLog[] {
  const priority: Record<RunJSLog['level'], number> = {
    error: 0,
    warn: 1,
    info: 2,
    log: 3,
  };

  return logs
    .map((log, index) => ({ log, index }))
    .sort((a, b) => {
      const pa = priority[a.log.level] ?? Number.MAX_SAFE_INTEGER;
      const pb = priority[b.log.level] ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return a.index - b.index;
    })
    .map((item) => item.log);
}

function collectLezerSyntaxIssues(code: string): RunJSIssue[] {
  const src = String(code || '');
  if (!src.trim()) return [];
  const text = Text.of(src.split('\n'));
  const isIgnoredPos = createIgnoredPosChecker(src);

  let cursor: TreeCursor;
  try {
    const tree = JS_PARSER.parse(src);
    cursor = tree.cursor();
  } catch (err) {
    // Parser itself failed (should be rare). Fall back to a single parse error at 1:1.
    return [
      {
        type: 'lint',
        ruleId: 'parse-error',
        message: `Syntax error: ${safeToString((err as any)?.message || err)}`,
        location: { start: { line: 1, column: 1 } },
      },
    ];
  }

  const issues: RunJSIssue[] = [];
  const seen = new Set<number>();

  const push = (pos: number) => {
    const p = Math.max(0, Math.min(src.length, pos));
    if (isIgnoredPos(p)) return;
    if (seen.has(p)) return;
    seen.add(p);

    const loc = posToLineColumn(text, p);
    const excerpt = src
      .slice(p, Math.min(src.length, p + 24))
      .replace(/\s+/g, ' ')
      .trim();
    const near = excerpt ? ` near "${excerpt}"` : '';
    issues.push({
      type: 'lint',
      ruleId: 'parse-error',
      message: `Syntax error${near}.`,
      location: { start: loc },
    });
  };

  // Lezer uses error recovery and exposes multiple error nodes (`cursor.type.isError`).
  // Traverse the entire tree and collect error node positions.
  do {
    if (cursor.type.isError) {
      push(cursor.from);
    }
  } while (cursor.next());

  return issues;
}

function collectHeuristicIssues(code: string): RunJSIssue[] {
  const src = String(code || '');
  if (!src.trim()) return [];
  const isIgnoredPos = createIgnoredPosChecker(src);
  const text = Text.of(src.split('\n'));
  const issues: RunJSIssue[] = [];

  const pushAtPos = (pos: number, ruleId: string, message: string) => {
    const p = Math.max(0, Math.min(src.length, pos));
    if (isIgnoredPos(p)) return;
    const loc = posToLineColumn(text, p);
    issues.push({ type: 'lint', ruleId, message, location: { start: loc } });
  };

  const collectNonCallableCallIssuesFallback = () => {
    const RULE_NONCALLABLE_CALL = 'no-noncallable-call';

    const seen = new Set<number>();
    const push = (pos: number) => {
      const p = Math.max(0, Math.min(src.length, pos));
      if (isIgnoredPos(p)) return;
      if (seen.has(p)) return;
      seen.add(p);
      pushAtPos(p, RULE_NONCALLABLE_CALL, 'This expression is not callable.');
    };

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
      let state: 'code' | 'lineComment' | 'blockComment' | 'single' | 'double' | 'template' = 'code';
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

        // code
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
        if (hasCallStartAt(after)) push(start);
        continue;
      }

      if (ch === '`') {
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
        if (hasCallStartAt(after)) push(start);
        continue;
      }

      if (ch >= '0' && ch <= '9') {
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
        const after = skipWS(i);
        if (hasCallStartAt(after)) push(start);
        i -= 1;
        continue;
      }

      if (isIdentStart(ch)) {
        const start = i;
        i += 1;
        while (i < len && isIdentPart(src[i])) i++;
        const word = src.slice(start, i);
        if (isKeywordLiteral(word)) {
          const after = skipWS(i);
          if (hasCallStartAt(after)) push(start);
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
              push(innerFrom);
            }
          }
        }
      }
    }
  };

  // If parsing fails, heuristics are skipped (syntax issues are handled by Lezer).
  let ast: any;
  try {
    const Parser: any = (acorn as any).Parser || (acorn as any);
    const ParserWithJSX = typeof jsx === 'function' ? Parser.extend(jsx()) : Parser;
    ast = ParserWithJSX.parse(src, {
      ecmaVersion: 2022,
      sourceType: 'script',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      locations: true,
    });
  } catch (_e) {
    collectNonCallableCallIssuesFallback();
    return issues;
  }

  const declared = new Set<string>([
    // Common globals / allowed runtime context roots
    'ctx',
    'console',
    'window',
    'document',
    'navigator',
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

  // Collect declared identifiers (very coarse, best-effort).
  try {
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
  } catch (_) {
    // ignore
  }

  // 1) Non-callable call: 123(), 'x'(), (1+2)(), ({})()
  try {
    acornWalk.full(ast, (node: any) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type !== 'CallExpression') return;
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
        const pos = (callee as any)?.start ?? node.start ?? 0;
        pushAtPos(pos, 'no-noncallable-call', 'This expression is not callable.');
      }
    });
  } catch (_) {
    // ignore
  }

  // 1.1) Suspicious ctx member call (common typo): ctx.xx() where `xx` is very short and likely undefined.
  // This is intentionally conservative to avoid false positives on legitimate ctx APIs.
  try {
    const reported = new Set<string>();
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
      if (!callee.computed && callee.property?.type === 'Identifier') {
        name = callee.property.name;
      } else if (callee.computed && callee.property?.type === 'Literal' && typeof callee.property.value === 'string') {
        name = callee.property.value;
      }

      if (!name || typeof name !== 'string') return;
      const normalized = name.trim();
      if (!normalized || normalized.startsWith('_')) return;
      if (normalized.length > 2) return;
      if (allowedShort.has(normalized)) return;
      if (reported.has(normalized)) return;

      const pos = (callee.property as any)?.start ?? callee.start ?? node.start ?? 0;
      pushAtPos(
        pos,
        'possible-undefined-ctx-member-call',
        `Possible undefined ctx method call: ctx.${normalized}(). This may be a typo or not available in the current ctx API.`,
      );
      reported.add(normalized);
    });
  } catch (_) {
    // ignore
  }

  // 2) Possible undefined variable (exclude declarations and property keys)
  try {
    const reported = new Set<string>();
    acornWalk.ancestor(ast, {
      Identifier(node: any, ancestors: any[]) {
        const name = node?.name;
        if (!name || declared.has(name) || reported.has(name)) return;
        const parent = ancestors[ancestors.length - 2];
        if (!parent) return;
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
        const pos = (node as any).start ?? 0;
        pushAtPos(pos, 'possible-undefined-variable', `Possible undefined variable: ${name}`);
        reported.add(name);
      },
    });
  } catch (_) {
    // ignore
  }

  return issues;
}

function createLogCollectors(out: RunJSLog[]) {
  const push = (level: RunJSLog['level'], args: any[]) => {
    const msg = args
      .map((x) => safeToString(x))
      .join(' ')
      .trim();
    out.push({ level, message: msg });
  };

  const consoleCapture = {
    log: (...args: any[]) => push('log', args),
    info: (...args: any[]) => push('info', args),
    warn: (...args: any[]) => push('warn', args),
    error: (...args: any[]) => push('error', args),
  };

  const loggerCapture = {
    trace: (...args: any[]) => push('log', args),
    debug: (...args: any[]) => push('log', args),
    info: (...args: any[]) => push('info', args),
    warn: (...args: any[]) => push('warn', args),
    error: (...args: any[]) => push('error', args),
    fatal: (...args: any[]) => push('error', args),
    child: () => loggerCapture,
  };

  return { consoleCapture, loggerCapture };
}

function pickKeyRuntimeIssue(runtimeIssues: RunJSIssue[]): RunJSIssue | undefined {
  if (!runtimeIssues.length) return undefined;
  const priority: Record<string, number> = {
    timeout: 0,
    internal: 1,
    'preview-start-failed': 2,
  };
  return [...runtimeIssues].sort((a, b) => {
    const pa = priority[String(a.ruleId || '')] ?? 10;
    const pb = priority[String(b.ruleId || '')] ?? 10;
    if (pa !== pb) return pa - pb;
    return 0;
  })[0];
}

function formatIssueLine(issue: RunJSIssue): string {
  const loc = issue.location?.start;
  const at = loc ? `line ${loc.line}:${loc.column} ` : '';
  const rid = issue.ruleId ? `(${issue.ruleId}) ` : '';
  return `${at}${rid}${issue.message}`.trim();
}

function formatExecution(exec?: DiagnoseRunJSResult['execution']): string {
  if (!exec) return 'Preview execution: unknown';
  const dur = typeof exec.durationMs === 'number' ? `${Math.round(exec.durationMs)}ms` : 'unknown';
  return `Preview execution: started=${exec.started}, finished=${exec.finished}, timeout=${exec.timeout}, duration=${dur}`;
}

function clampText(s: string, max: number, tail = '…'): string {
  const str = String(s || '');
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - tail.length))}${tail}`;
}

function buildPreviewMessage(
  result: DiagnoseRunJSResult,
  options: {
    maxChars: number;
    maxLogs: number;
    maxLogChars: number;
    maxIssues: number;
    includeStack: boolean;
    maxStackChars: number;
  },
): { message: string; truncated: boolean } {
  const { issues, logs, execution } = result;
  const lintIssues = issues.filter((i) => i.type === 'lint');
  const runtimeIssues = issues.filter((i) => i.type === 'runtime');
  const sortedLogs = sortLogsStable(logs);
  const keyRuntime = pickKeyRuntimeIssue(runtimeIssues);

  const lines: string[] = [];
  const total = issues.length;
  const lintCount = lintIssues.length;
  const runtimeCount = runtimeIssues.length;
  const logsCount = sortedLogs.length;

  const pushLogsSection = (list: RunJSLog[]) => {
    if (!list.length) return;
    lines.push('Key logs:');
    list.forEach((l) => {
      lines.push(`[${l.level}] ${clampText(l.message, options.maxLogChars)}`);
    });
    if (sortedLogs.length > list.length) {
      lines.push(`... ${sortedLogs.length - list.length} more logs not shown`);
    }
  };

  if (total === 0) {
    const hasAlertLogs = sortedLogs.some((log) => log.level === 'warn' || log.level === 'error');
    lines.push(
      hasAlertLogs
        ? `RunJS preview completed with warning/error logs: no diagnostic issues found. Logs: ${logsCount}.`
        : `RunJS preview succeeded: no issues found. Logs: ${logsCount}.`,
    );
    lines.push(formatExecution(execution));
    const pickedLogs = sortedLogs.slice(0, Math.max(0, options.maxLogs));
    if (pickedLogs.length) {
      lines.push('');
      pushLogsSection(pickedLogs);
    }
    const message = lines.join('\n').trimEnd();
    return {
      message: clampText(message, options.maxChars),
      truncated: message.length > options.maxChars,
    };
  }

  lines.push(
    `RunJS preview failed: ${total} issues (lint ${lintCount} / runtime ${runtimeCount}), logs: ${logsCount}.`,
  );
  lines.push(formatExecution(execution));
  lines.push('');

  const pushIssueSection = (title: string, list: RunJSIssue[]) => {
    if (!list.length) return;
    lines.push(`${title}：`);
    const limited = list.slice(0, Math.max(0, options.maxIssues));
    limited.forEach((it, idx) => {
      const base = `${idx + 1}) ${formatIssueLine(it)}`;
      lines.push(base);
      if (options.includeStack && it.stack) {
        const stack = clampText(String(it.stack), options.maxStackChars);
        lines.push(clampText(stack, options.maxStackChars));
      }
    });
    if (list.length > limited.length) {
      lines.push(`... ${list.length - limited.length} more not shown`);
    }
    lines.push('');
  };

  // Ensure key runtime issue is always included when truncating issue lists.
  const runtimeOrdered =
    keyRuntime && runtimeIssues.length > 1
      ? [keyRuntime, ...runtimeIssues.filter((x) => x !== keyRuntime)]
      : runtimeIssues;

  pushIssueSection('Static issues', lintIssues);
  pushIssueSection('Runtime issues', runtimeOrdered);

  const pickedLogs = sortedLogs.slice(0, Math.max(0, options.maxLogs));
  if (pickedLogs.length) {
    pushLogsSection(pickedLogs);
  }

  const message = lines.join('\n').trimEnd();
  const truncated = message.length > options.maxChars;
  return { message: truncated ? clampText(message, options.maxChars) : message, truncated };
}

function buildPreviewMessageWithTruncation(result: DiagnoseRunJSResult): string {
  const summaryLine = `(issues total ${result.issues.length}, logs total ${result.logs.length})`;

  const attempts = [
    { maxLogs: 40, maxLogChars: 220, maxIssues: 12, includeStack: true, maxStackChars: 800 },
    { maxLogs: 20, maxLogChars: 160, maxIssues: 10, includeStack: true, maxStackChars: 400 },
    { maxLogs: 12, maxLogChars: 140, maxIssues: 8, includeStack: false, maxStackChars: 0 },
    { maxLogs: 8, maxLogChars: 120, maxIssues: 5, includeStack: false, maxStackChars: 0 },
    // last: keep only key runtime issue + few lint, logs almost none
    { maxLogs: 3, maxLogChars: 100, maxIssues: 3, includeStack: false, maxStackChars: 0 },
  ];

  let overflowed = false;
  for (const opt of attempts) {
    const { message, truncated } = buildPreviewMessage(result, { ...opt, maxChars: MAX_MESSAGE_CHARS });
    overflowed = overflowed || truncated;
    if (!truncated) {
      if (!overflowed) return message;
      const withNote = `RunJS preview output was truncated.\n${summaryLine}\n\n${message}`;
      return clampText(withNote, MAX_MESSAGE_CHARS);
    }
  }

  // Hard truncate fallback but MUST preserve summary + key runtime issue when present.
  const runtimeIssues = result.issues.filter((i) => i.type === 'runtime');
  const keyRuntime = pickKeyRuntimeIssue(runtimeIssues);
  const keyRuntimeLine = keyRuntime ? `Key runtime issue: ${formatIssueLine(keyRuntime)}` : '';

  const baseLines = [
    'RunJS preview output was truncated.',
    summaryLine,
    result.execution ? formatExecution(result.execution) : undefined,
    keyRuntimeLine || undefined,
  ].filter(Boolean) as string[];

  const base = baseLines.join('\n').trim();
  if (base.length <= MAX_MESSAGE_CHARS) return base;
  return clampText(base, MAX_MESSAGE_CHARS - 1) + '\n';
}

export function formatRunJSPreviewMessage(result: DiagnoseRunJSResult): string {
  return buildPreviewMessageWithTruncation(result);
}

export async function diagnoseRunJS(code: string, ctx: FlowContext): Promise<DiagnoseRunJSResult> {
  const src = typeof code === 'string' ? code : String(code ?? '');
  const logs: RunJSLog[] = [];
  const issues: RunJSIssue[] = [];

  // Lint: multi syntax errors (Lezer) + heuristics (acorn)
  issues.push(...collectLezerSyntaxIssues(src));
  issues.push(...collectHeuristicIssues(src));

  const startedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
  const execution = { started: false, finished: false, timeout: false, durationMs: undefined as number | undefined };

  try {
    execution.started = true;

    const { consoleCapture, loggerCapture } = createLogCollectors(logs);

    const baseGlobals: Record<string, any> = { console: consoleCapture };
    try {
      if (typeof window !== 'undefined') {
        const navigator = createSafeNavigator();
        baseGlobals.navigator = navigator;
        baseGlobals.window = createSafeWindow({ navigator });
        baseGlobals.document = createSafeDocument();
      }
    } catch (_) {
      // ignore safe globals failures
    }

    let prepared = src;
    try {
      prepared = await prepareRunJsCode(src, { preprocessTemplates: true });
    } catch (e) {
      // Compilation/preprocess failure is treated as runtime issue
      const name = String((e as any)?.name || '');
      const msg = safeToString((e as any)?.message || e);
      const looksLikeSyntax = e instanceof SyntaxError || /^SyntaxError\b/i.test(name) || /SyntaxError\b/i.test(msg);
      issues.push({
        type: 'runtime',
        ruleId: looksLikeSyntax ? 'preview-start-failed' : 'internal',
        message: looksLikeSyntax ? msg : `Preview internal failure: ${msg}`,
        stack: safeStack(e),
      });
      execution.finished = true;
      execution.timeout = false;
      return { issues: sortIssuesStable(issues), logs, execution };
    }

    // Use ctx.createJSRunner() so preview execution matches the real RunJS environment:
    // - FlowRunJSContext / specific RunJSContext
    // - deprecation proxy behavior
    // - libs injection (React/antd/etc)
    const runner: JSRunner = await (ctx as any).createJSRunner({ globals: baseGlobals, timeoutMs: PREVIEW_TIMEOUT_MS });
    // Capture ctx.logger.* into preview logs (and make deprecation warnings visible).
    // NOTE: user code runs with the JSRunner global `ctx` (RunJSContext), not the runtime `ctx` passed in here.
    const runjsCtx = (runner as any).globals.ctx;
    runjsCtx.defineProperty('logger', { value: loggerCapture });
    const res = await runner.run(prepared);
    execution.finished = true;
    execution.timeout = !!res?.timeout;

    if (!res?.success) {
      const err = res?.error;
      const msg = res?.timeout ? 'Execution timed out' : safeToString((err as any)?.message || err || 'Unknown error');
      const isSyntax = err instanceof SyntaxError || /^SyntaxError\b/i.test(String((err as any)?.name || ''));
      issues.push({
        type: 'runtime',
        ruleId: res?.timeout ? 'timeout' : isSyntax ? 'preview-start-failed' : 'runtime-error',
        message: msg,
        stack: safeStack(err),
      });
    }
  } catch (e) {
    execution.finished = true;
    execution.timeout = false;
    issues.push({
      type: 'runtime',
      ruleId: 'internal',
      message: `Preview internal failure: ${safeToString((e as any)?.message || e)}`,
      stack: safeStack(e),
    });
  } finally {
    const endedAt =
      typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
    const dur = Math.max(0, endedAt - startedAt);
    execution.durationMs = Number.isFinite(dur) ? dur : undefined;
  }

  return { issues: sortIssuesStable(issues), logs, execution };
}

function createPreviewFlowContext(ctx: FlowContext): FlowContext {
  const previewCtx = new FlowContext();
  previewCtx.addDelegate(ctx);
  if (typeof document !== 'undefined' && typeof document.createElement === 'function' && !ctx.element) {
    try {
      const previewEl: any = document.createElement('div');
      previewCtx.defineProperty('element', { value: previewEl });
    } catch (_) {
      // ignore preview element injection failures
    }
  }
  return previewCtx;
}

export async function previewRunJS(code: string, ctx: FlowContext): Promise<PreviewRunJSResult> {
  const previewCtx = createPreviewFlowContext(ctx);
  const result = await diagnoseRunJS(code, previewCtx);
  const success = result.issues.length === 0;
  const message = formatRunJSPreviewMessage(result);
  const final = message.length > MAX_MESSAGE_CHARS ? clampText(message, MAX_MESSAGE_CHARS) : message;
  return { success, message: final };
}
