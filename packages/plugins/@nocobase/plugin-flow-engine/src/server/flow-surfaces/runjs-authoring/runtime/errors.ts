/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceErrorItemInput } from '../../errors';
import { getRunJsAuthoringRule } from '../rules';
import type { RunJsAuthoringRepairClass } from '../types';
import {
  CONTEXT_FIRST_REPAIR_CLASSES,
  RUNJS_CONTEXT_AND_RETRY_INSTRUCTION,
  RUNJS_FIX_AND_RETRY_INSTRUCTION,
} from './constants';

export function buildRunJsAuthoringError(input: {
  path: string;
  repairClass: RunJsAuthoringRepairClass;
  message: string;
  modelUse?: string;
  surface?: string;
  index: number;
  source: string;
  ruleId?: string;
  details?: Record<string, any>;
}): FlowSurfaceErrorItemInput {
  const rule = getRunJsAuthoringRule(input.repairClass);
  const loc = getLineColumn(input.source, input.index);
  const agentInstruction = getRunJsAuthoringAgentInstruction(input.repairClass);
  return {
    path: input.path,
    ruleId: input.ruleId || rule.defaultRuleId,
    message: buildRunJsAuthoringErrorMessage(input.message, agentInstruction, rule.suggestedAction),
    details: buildDefinedDetails({
      repairClass: input.repairClass,
      suggestedAction: rule.suggestedAction,
      skipForbidden: true,
      mustRetry: true,
      agentInstruction,
      line: loc.line,
      column: loc.column,
      ...input.details,
    }),
  };
}

function getRunJsAuthoringAgentInstruction(repairClass: RunJsAuthoringRepairClass) {
  return CONTEXT_FIRST_REPAIR_CLASSES.has(repairClass)
    ? RUNJS_CONTEXT_AND_RETRY_INSTRUCTION
    : RUNJS_FIX_AND_RETRY_INSTRUCTION;
}

function buildRunJsAuthoringErrorMessage(message: string, agentInstruction: string, suggestedAction: string) {
  return [message, agentInstruction, suggestedAction ? `Suggested fix: ${suggestedAction}` : '']
    .filter(Boolean)
    .join(' ');
}

function buildDefinedDetails(details: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => typeof value !== 'undefined' && value !== ''),
  );
}

function getLineColumn(source: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, source.length));
  const prefix = source.slice(0, safeIndex);
  const lines = prefix.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

export function dedupeErrors(errors: FlowSurfaceErrorItemInput[]) {
  const seen = new Set<string>();
  return errors.filter((error) => {
    const key = `${error.path}:${error.ruleId}:${error.details?.line}:${error.details?.column}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
