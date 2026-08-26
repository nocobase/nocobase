/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { blockedCapabilityRerouteRule } from './blocked-capability-reroute';
import { blockedGlobalStopRule } from './blocked-global-stop';
import { ctxLibsMemberMismatchStopRule } from './ctx-libs-member-mismatch-stop';
import { ctxRootMismatchStopRule } from './ctx-root-mismatch-stop';
import { missingTopLevelReturnRule } from './missing-top-level-return';
import { nestedRunjsStopRule } from './nested-runjs-stop';
import { renderTopLevelFunctionWrapperRule } from './render-top-level-function-wrapper';
import { renderUnreachableRenderCallRule } from './render-unreachable-render-call';
import { replaceInnerHtmlWithRenderRule } from './replace-innerhtml-with-render';
import { reactRuntimeContractStopRule } from './react-runtime-contract-stop';
import { resourceRuntimeContractStopRule } from './resource-runtime-contract-stop';
import { sourceLimitStopRule } from './source-limit-stop';
import { switchToResourceApiRule } from './switch-to-resource-api';
import { syntaxStopRule } from './syntax-stop';
import { unknownGlobalStopRule } from './unknown-global-stop';
import { unknownModelStopRule } from './unknown-model-stop';
import { unknownSurfaceStopRule } from './unknown-surface-stop';
import { valueSurfaceForbidsRenderRule } from './value-surface-forbids-render';
import type { RunJsAuthoringRepairClass, RunJsAuthoringRuleDefinition } from './types';

export const RUNJS_AUTHORING_RULES: RunJsAuthoringRuleDefinition[] = [
  syntaxStopRule,
  nestedRunjsStopRule,
  sourceLimitStopRule,
  switchToResourceApiRule,
  missingTopLevelReturnRule,
  valueSurfaceForbidsRenderRule,
  unknownSurfaceStopRule,
  unknownModelStopRule,
  replaceInnerHtmlWithRenderRule,
  renderTopLevelFunctionWrapperRule,
  renderUnreachableRenderCallRule,
  blockedGlobalStopRule,
  unknownGlobalStopRule,
  blockedCapabilityRerouteRule,
  reactRuntimeContractStopRule,
  resourceRuntimeContractStopRule,
  ctxLibsMemberMismatchStopRule,
  ctxRootMismatchStopRule,
];

export const RUNJS_AUTHORING_RULE_BY_REPAIR_CLASS = RUNJS_AUTHORING_RULES.reduce(
  (memo, rule) => {
    memo[rule.repairClass] = rule;
    return memo;
  },
  {} as Record<RunJsAuthoringRepairClass, RunJsAuthoringRuleDefinition>,
);

export function getRunJsAuthoringRule(repairClass: RunJsAuthoringRepairClass) {
  return RUNJS_AUTHORING_RULE_BY_REPAIR_CLASS[repairClass];
}
