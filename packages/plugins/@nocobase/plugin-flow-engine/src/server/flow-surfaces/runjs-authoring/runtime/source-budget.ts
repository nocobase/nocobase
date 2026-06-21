/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceErrorItemInput } from '../../errors';
import type { RunJsAuthoringInspectionInput } from '../types';
import type { RunJsAuthoringContext, RunJsSourceBudget } from '../internal-types';
import { MAX_RUNJS_SOURCES_PER_REQUEST, MAX_RUNJS_SOURCE_LENGTH, MAX_RUNJS_TOTAL_SOURCE_LENGTH } from './constants';
import { buildRunJsAuthoringError } from './errors';

export function createRunJsSourceBudget(): RunJsSourceBudget {
  return {
    count: 0,
    totalLength: 0,
  };
}

export function collectRunJsSourceLimitErrors(
  input: RunJsAuthoringInspectionInput,
  budget?: RunJsSourceBudget,
): { errors: FlowSurfaceErrorItemInput[]; skipInspection: boolean } {
  const source = String(input.code || '');
  const sourceLength = source.length;
  const modelUse = normalizeText(input.modelUse);
  const surface = normalizeText(input.surface);
  const errors: FlowSurfaceErrorItemInput[] = [];

  if (budget) {
    budget.count += 1;
    budget.totalLength += sourceLength;
  }

  const pushLimitError = (ruleId: string, message: string, details?: Record<string, any>) => {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'source-limit-stop',
        ruleId,
        message,
        modelUse,
        surface,
        index: 0,
        source,
        details,
      }),
    );
  };

  const sourceTooLarge = sourceLength > MAX_RUNJS_SOURCE_LENGTH;
  if (sourceTooLarge && (!budget || budget.count <= MAX_RUNJS_SOURCES_PER_REQUEST)) {
    pushLimitError(
      'runjs-source-too-large',
      `flowSurfaces authoring ${input.path} RunJS source is too large to validate safely`,
      {
        maxSourceLength: MAX_RUNJS_SOURCE_LENGTH,
        sourceLength,
      },
    );
  }

  let requestLimitExceeded = false;
  if (budget && budget.count > MAX_RUNJS_SOURCES_PER_REQUEST) {
    requestLimitExceeded = true;
    if (!budget.countLimitReported) {
      budget.countLimitReported = true;
      pushLimitError(
        'runjs-too-many-sources',
        `flowSurfaces authoring request contains too many RunJS sources to validate safely`,
        {
          maxSources: MAX_RUNJS_SOURCES_PER_REQUEST,
          sourceCount: budget.count,
        },
      );
    }
  }

  if (budget && budget.totalLength > MAX_RUNJS_TOTAL_SOURCE_LENGTH) {
    requestLimitExceeded = true;
    if (!budget.totalLimitReported) {
      budget.totalLimitReported = true;
      pushLimitError(
        'runjs-total-source-too-large',
        `flowSurfaces authoring request contains too much RunJS source to validate safely`,
        {
          maxTotalSourceLength: MAX_RUNJS_TOTAL_SOURCE_LENGTH,
          totalSourceLength: budget.totalLength,
        },
      );
    }
  }

  return { errors, skipInspection: sourceTooLarge || requestLimitExceeded };
}

function normalizeText(value: any) {
  return typeof value === 'string' ? value.trim() : '';
}
