/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionProblemPhase, LightExtensionProblemSeverity } from '../../../shared/types';
import { stableSerializeLightExtensionProblemValue } from '../../../shared/problems';
import type ts from 'typescript';

import type { LightExtensionValidatorProblem, ProblemTarget } from './types';

export function problemAt(
  sourceFile: ts.SourceFile,
  position: number,
  code: string,
  severity: LightExtensionProblemSeverity,
  message: string,
  target: Omit<ProblemTarget, 'path'> = {},
  phase: LightExtensionProblemPhase = 'policy',
): LightExtensionValidatorProblem {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  return problem(code, severity, message, {
    ...target,
    path: sourceFile.fileName,
    range: {
      start: {
        line: location.line + 1,
        column: location.character + 1,
      },
    },
    phase,
  });
}

export function problem(
  code: string,
  severity: LightExtensionProblemSeverity,
  message: string,
  extra: Partial<LightExtensionValidatorProblem> = {},
): LightExtensionValidatorProblem {
  return {
    phase: extra.phase || 'policy',
    code,
    severity,
    message,
    ...compactProblem(extra),
  };
}

export function schemaProblem(
  code: string,
  severity: LightExtensionProblemSeverity,
  message: string,
  extra: Partial<LightExtensionValidatorProblem> = {},
): LightExtensionValidatorProblem {
  return problem(code, severity, message, { ...extra, phase: 'schema' });
}

export function stableProblemDetailsKey(details: Record<string, unknown> | undefined): string {
  return details ? stableSerializeLightExtensionProblemValue(details) : '';
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactProblem(input: Partial<LightExtensionValidatorProblem>): Partial<LightExtensionValidatorProblem> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== 'undefined' && value !== null),
  ) as Partial<LightExtensionValidatorProblem>;
}
