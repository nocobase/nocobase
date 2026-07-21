/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import vm from 'node:vm';

export type AIPageDiagnostic = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
};

export function validateAIPageCode(code: string) {
  const diagnostics: AIPageDiagnostic[] = [];

  try {
    new vm.Script(`async function __nocobaseAIPage(ctx) {\n${code}\n}`);
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      code: 'syntax_error',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const warnings: Array<[RegExp, string, string]> = [
    [/\beval\s*\(/, 'avoid_eval', 'Avoid eval(); use the page runtime APIs instead.'],
    [/\bnew\s+Function\s*\(/, 'avoid_function_constructor', 'Avoid the Function constructor.'],
    [/\blocalStorage\b/, 'avoid_local_storage', 'Prefer NocoBase collections or page-scoped state over localStorage.'],
  ];
  for (const [pattern, diagnosticCode, message] of warnings) {
    if (pattern.test(code)) {
      diagnostics.push({ severity: 'warning', code: diagnosticCode, message });
    }
  }

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    diagnostics,
  };
}
