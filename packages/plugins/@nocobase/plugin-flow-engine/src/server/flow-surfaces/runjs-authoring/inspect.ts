/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceErrorItemInput } from '../errors';
import type { RunJsAuthoringInspectionInput } from './types';
import type { RunJsAuthoringContext, RunJsSourceBudget } from './internal-types';
import {
  KNOWN_MODEL_USES,
  MAX_RUNJS_ERRORS_PER_SOURCE,
  SURFACE_ALLOWED_MODEL_USES,
  SURFACE_STYLE_BY_ID,
} from './runtime/constants';
import { normalizeText, resolveSurfaceStyle } from './runtime/surface';
import { parseRunJsAuthoringAst } from './ast/parser';
import { buildRunJsAuthoringError, dedupeErrors } from './runtime/errors';
import { collectRunJsSourceLimitErrors } from './runtime/source-budget';
import { scanJavaScriptSource } from './scan';
import { collectRunJsInspectionErrors } from './validators';

export function inspectRunJsAuthoringCodeForWrite(
  input: RunJsAuthoringInspectionInput,
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const limitResult = collectRunJsSourceLimitErrors(input, budget);
  if (limitResult.skipInspection || limitResult.errors.length) {
    return limitResult.errors;
  }
  return inspectRunJsAuthoringCode(input, context);
}

export function inspectRunJsAuthoringCode(
  input: RunJsAuthoringInspectionInput,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  const source = String(input.code || '');
  const modelUse = normalizeText(input.modelUse);
  const surface = normalizeText(input.surface);
  const surfaceStyle = resolveSurfaceStyle(input);
  const sourceLimitResult = collectRunJsSourceLimitErrors(input);
  if (sourceLimitResult.skipInspection || sourceLimitResult.errors.length) {
    return sourceLimitResult.errors;
  }

  if (surface && !SURFACE_STYLE_BY_ID[surface]) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} references unknown RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (modelUse && !KNOWN_MODEL_USES.has(modelUse)) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} references unknown JS model '${modelUse}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (
    surface &&
    modelUse &&
    SURFACE_ALLOWED_MODEL_USES[surface] &&
    !SURFACE_ALLOWED_MODEL_USES[surface].has(modelUse)
  ) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} model '${modelUse}' is not supported by RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (!surfaceStyle) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: modelUse ? 'unknown-model-stop' : 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} cannot resolve a RunJS validation surface`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  const parseResult = parseRunJsAuthoringAst(source);
  if (parseResult.error) {
    return [
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'syntax-stop',
        ruleId: 'runjs-syntax-invalid',
        message: `flowSurfaces authoring ${input.path} has invalid JavaScript syntax: ${parseResult.error.message}`,
        modelUse,
        surface,
        index: parseResult.error.index,
        source,
        details: {
          syntaxMessage: parseResult.error.message,
        },
      }),
    ];
  }

  const scan = scanJavaScriptSource(source, parseResult.ast, context, modelUse);
  errors.push(
    ...collectRunJsInspectionErrors({
      context,
      input,
      modelUse,
      scan,
      source,
      surface,
      surfaceStyle,
    }),
  );
  return dedupeErrors(errors).slice(0, MAX_RUNJS_ERRORS_PER_SOURCE);
}
