/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { linter } from '@codemirror/lint';
import * as acorn from 'acorn';
import { simple as walk } from 'acorn-walk';

interface CommentDirectives {
  globalDirectives: string[];
  ignoreRanges: Array<{ start: number; end: number }>;
}

/**
 * 解析代码中的特殊注释指令
 */
const parseCommentDirectives = (code: string): CommentDirectives => {
  const globalDirectives: string[] = [];
  const ignoreRanges: Array<{ start: number; end: number }> = [];

  // 匹配 /* global var1, var2 */ 或 // global var1, var2
  const globalRegex = /(?:\/\*\s*global\s+([^*]+)\*\/|\/\/\s*global\s+(.+))/gi;
  let match;
  while ((match = globalRegex.exec(code)) !== null) {
    const varsText = match[1] || match[2];
    if (varsText) {
      const vars = varsText
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v);
      globalDirectives.push(...vars);
    }
  }

  // 匹配 /* eslint-disable */ 或 // eslint-disable-line
  const disableRegex = /(?:\/\*\s*eslint-disable(?:\s+[^*]+)?\s*\*\/|\/\/\s*eslint-disable-line)/gi;
  while ((match = disableRegex.exec(code)) !== null) {
    // 找到禁用注释的行
    const lines = code.substring(0, match.index).split('\n');
    const lineNumber = lines.length - 1;
    const lineStart = lines.slice(0, lineNumber).join('\n').length + (lineNumber > 0 ? 1 : 0);
    const lineEnd = lineStart + (lines[lineNumber]?.length || 0);

    ignoreRanges.push({ start: lineStart, end: lineEnd });
  }

  return { globalDirectives, ignoreRanges };
};

/**
 * 获取默认的全局变量集合
 */
const getDefaultGlobals = (): Set<string> => {
  return new Set([
    // lowcode 环境提供的变量
    'element',
    'ctx',
    'model',
    'requirejs',
    'requireAsync',
    'loadCSS',
    // JavaScript 内置对象
    'console',
    'window',
    'document',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'Promise',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Date',
    'Math',
    'JSON',
    'Error',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    // 常用的全局函数
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'fetch',
    'XMLHttpRequest',
    'FormData',
    'URLSearchParams',
    // 现代 JavaScript
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Symbol',
    'Proxy',
    'Reflect',
    // 异步相关
    'async',
    'await',
    // 常用库可能暴露的全局变量
    'echarts',
    'Chart',
    '_',
    'lodash',
    '$',
    'jQuery',
    'moment',
  ]);
};

/**
 * 收集代码中定义的变量
 */
const collectDefinedVariables = (ast: any, availableGlobals: Set<string>): Set<string> => {
  const definedVariables = new Set(availableGlobals);

  try {
    walk(ast, {
      // 变量声明
      VariableDeclarator(node) {
        if (node && node.id && node.id.type === 'Identifier' && node.id.name) {
          definedVariables.add(node.id.name);
        }
      },

      // 函数声明
      FunctionDeclaration(node) {
        if (node && node.id && node.id.name) {
          definedVariables.add(node.id.name);
        }
        // 函数参数
        if (node && node.params && Array.isArray(node.params)) {
          node.params.forEach((param) => {
            if (param && param.type === 'Identifier' && param.name) {
              definedVariables.add(param.name);
            }
          });
        }
      },

      // 函数表达式参数
      FunctionExpression(node) {
        if (node && node.id && node.id.name) {
          definedVariables.add(node.id.name);
        }
        if (node && node.params && Array.isArray(node.params)) {
          node.params.forEach((param) => {
            if (param && param.type === 'Identifier' && param.name) {
              definedVariables.add(param.name);
            }
          });
        }
      },

      // 箭头函数参数
      ArrowFunctionExpression(node) {
        if (node && node.params && Array.isArray(node.params)) {
          node.params.forEach((param) => {
            if (param && param.type === 'Identifier' && param.name) {
              definedVariables.add(param.name);
            }
          });
        }
      },
    });
  } catch (e) {
    console.warn('Variable collection failed:', e);
  }

  return definedVariables;
};

/**
 * 检查标识符使用情况
 */
const checkIdentifierUsage = (
  ast: any,
  definedVariables: Set<string>,
  shouldIgnoreError: (position: number) => boolean,
) => {
  const diagnostics: any[] = [];

  try {
    walk(ast, {
      Identifier(node, ancestors) {
        // 基本验证
        if (!node || !node.name || typeof node.name !== 'string') {
          return;
        }

        // 确保有父节点信息
        if (!ancestors || !Array.isArray(ancestors) || ancestors.length < 2) {
          // 如果没有父节点信息，假设是变量使用并检查
          if (!definedVariables.has(node.name)) {
            const errorPos = node.start || 0;
            if (!shouldIgnoreError(errorPos)) {
              diagnostics.push({
                from: errorPos,
                to: node.end || errorPos + node.name.length,
                severity: 'error',
                message: `'${node.name}' is not defined`,
                actions: [],
              });
            }
          }
          return;
        }

        // 检查是否在定义位置（忽略定义时的标识符）
        const parent = ancestors[ancestors.length - 2];
        if (!parent || !parent.type) {
          // 没有父节点类型信息，假设是变量使用
          if (!definedVariables.has(node.name)) {
            const errorPos = node.start || 0;
            if (!shouldIgnoreError(errorPos)) {
              diagnostics.push({
                from: errorPos,
                to: node.end || errorPos + node.name.length,
                severity: 'error',
                message: `'${node.name}' is not defined`,
                actions: [],
              });
            }
          }
          return;
        }

        const isDefinition =
          (parent.type === 'VariableDeclarator' && parent.id === node) ||
          (parent.type === 'FunctionDeclaration' && parent.id === node) ||
          (parent.type === 'Property' && parent.key === node && !parent.computed) ||
          (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
          (parent.type === 'AssignmentPattern' && parent.left === node) ||
          parent.type === 'ImportDefaultSpecifier' ||
          parent.type === 'ImportSpecifier';

        // 如果不是定义位置，且变量未定义，则报错
        if (!isDefinition && !definedVariables.has(node.name)) {
          const errorPos = node.start || 0;
          // 检查是否应该忽略这个错误
          if (!shouldIgnoreError(errorPos)) {
            diagnostics.push({
              from: errorPos,
              to: node.end || errorPos + node.name.length,
              severity: 'error',
              message: `'${node.name}' is not defined`,
              actions: [],
            });
          }
        }
      },
    });
  } catch (e) {
    console.warn('Identifier checking failed:', e);
  }

  return diagnostics;
};

/**
 * 创建 JavaScript 语法检查器
 */
export const createJavaScriptLinter = () => {
  return linter((view) => {
    const diagnostics: any[] = [];
    const text = view.state.doc.toString();

    // 如果代码为空，不进行检查
    if (!text.trim()) {
      return diagnostics;
    }

    // 解析注释指令
    const { globalDirectives, ignoreRanges } = parseCommentDirectives(text);

    // 定义可用的全局变量
    const availableGlobals = getDefaultGlobals();
    // 添加注释中声明的全局变量
    globalDirectives.forEach((varName) => availableGlobals.add(varName));

    // 检查错误是否应该被忽略
    const shouldIgnoreError = (position: number): boolean => {
      return ignoreRanges.some((range) => position >= range.start && position <= range.end);
    };

    try {
      // 使用 acorn 解析代码
      const ast = acorn.parse(text, {
        ecmaVersion: 2022,
        sourceType: 'script',
        allowAwaitOutsideFunction: true,
        locations: true,
      });

      // 检查 AST 是否有效
      if (!ast || typeof ast !== 'object') {
        return diagnostics;
      }

      // 收集所有变量声明
      const definedVariables = collectDefinedVariables(ast, availableGlobals);

      // 检查标识符使用
      const identifierDiagnostics = checkIdentifierUsage(ast, definedVariables, shouldIgnoreError);
      diagnostics.push(...identifierDiagnostics);
    } catch (error: any) {
      // 语法错误
      let from = 0;
      let to = text.length;

      // 尝试解析位置信息
      if (error.loc) {
        const lines = text.split('\n');
        from = lines.slice(0, error.loc.line - 1).join('\n').length + (error.loc.line > 1 ? 1 : 0) + error.loc.column;
        to = from + 1;
      } else if (error.pos !== undefined) {
        from = error.pos;
        to = from + 1;
      }

      diagnostics.push({
        from,
        to,
        severity: 'error',
        message: `Syntax error: ${error.message}`,
        actions: [],
      });
    }

    return diagnostics;
  });
};
