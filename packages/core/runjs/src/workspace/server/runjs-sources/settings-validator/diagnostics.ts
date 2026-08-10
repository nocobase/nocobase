/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSWorkspaceDiagnostic,
  RunJSWorkspaceDiagnosticSeverity,
} from '../../../shared/runjs-source-contracts';
import type ts from 'typescript';

import type { DiagnosticTarget } from './types';

export function diagnosticAt(
  sourceFile: ts.SourceFile,
  position: number,
  code: string,
  severity: RunJSWorkspaceDiagnosticSeverity,
  message: string,
  target: Omit<DiagnosticTarget, 'path'> = {},
): RunJSWorkspaceDiagnostic {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  return diagnostic(code, severity, message, {
    ...target,
    path: sourceFile.fileName,
    line: location.line + 1,
    column: location.character + 1,
  });
}

export function diagnostic(
  code: string,
  severity: RunJSWorkspaceDiagnosticSeverity,
  message: string,
  extra: Partial<RunJSWorkspaceDiagnostic> = {},
): RunJSWorkspaceDiagnostic {
  return {
    code,
    severity,
    message,
    ...compactDiagnostic(extra),
  };
}

export function stableDetailsKey(details: Record<string, unknown> | undefined): string {
  if (!details) {
    return '';
  }

  return JSON.stringify(toStableJson(details));
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactDiagnostic(input: Partial<RunJSWorkspaceDiagnostic>): Partial<RunJSWorkspaceDiagnostic> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== 'undefined' && value !== null),
  ) as Partial<RunJSWorkspaceDiagnostic>;
}

function toStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toStableJson);
  }
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, toStableJson(value[key])]),
    );
  }

  return value;
}
