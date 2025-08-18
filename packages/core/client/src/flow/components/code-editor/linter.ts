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

export const createJavaScriptLinter = () => {
  return linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const text = view.state.doc.toString();

    // 如果代码为空，不进行检查
    if (!text.trim()) {
      return diagnostics;
    }

    try {
      // 使用 acorn 解析代码，只检查语法错误
      acorn.parse(text, {
        ecmaVersion: 2022,
        sourceType: 'script',
        allowAwaitOutsideFunction: true,
        locations: true,
      });
    } catch (error) {
      const acornError = error as AcornError;
      // 语法错误
      let from = 0;
      let to = text.length;

      // 尝试解析位置信息
      if (acornError.loc) {
        const lines = text.split('\n');
        from =
          lines.slice(0, acornError.loc.line - 1).join('\n').length +
          (acornError.loc.line > 1 ? 1 : 0) +
          acornError.loc.column;
        to = from + 1;
      } else if (acornError.pos !== undefined) {
        from = acornError.pos;
        to = from + 1;
      }

      diagnostics.push({
        from,
        to,
        severity: 'error',
        message: `Syntax error: ${acornError.message}`,
        actions: [],
      });
    }

    return diagnostics;
  });
};
