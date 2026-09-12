/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJsAuthoringRepairClass =
  | 'syntax-stop'
  | 'nested-runjs-stop'
  | 'source-limit-stop'
  | 'switch-to-resource-api'
  | 'missing-top-level-return'
  | 'value-surface-forbids-render'
  | 'unknown-surface-stop'
  | 'unknown-model-stop'
  | 'replace-innerhtml-with-render'
  | 'render-top-level-function-wrapper'
  | 'render-unreachable-render-call'
  | 'unknown-global-stop'
  | 'blocked-capability-reroute'
  | 'react-runtime-contract-stop'
  | 'resource-runtime-contract-stop'
  | 'ctx-libs-member-mismatch-stop'
  | 'ctx-root-mismatch-stop';

export type RunJsAuthoringSurfaceStyle = 'render' | 'value' | 'action';

export interface RunJsAuthoringRuleDefinition {
  repairClass: RunJsAuthoringRepairClass;
  defaultRuleId: string;
  suggestedAction: string;
}

export interface RunJsAuthoringInspectionInput {
  code: string;
  path: string;
  modelUse?: string;
  surface?: string;
  surfaceStyle?: RunJsAuthoringSurfaceStyle;
}
