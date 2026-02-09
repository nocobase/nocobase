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

export const computeDiagnosticsFromText = (text: string): Diagnostic[] => {
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
          push(from, to, 'This expression is not callable.');
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

export const createJavaScriptLinter = () => {
  return linter((view) => {
    const text = view.state.doc.toString();
    return computeDiagnosticsFromText(text);
  });
};
