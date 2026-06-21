/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceErrorItemInput } from '../../errors';
import type {
  CtxLibMemberCaseMismatch,
  InvalidCtxLibMemberAccess,
  InvalidReactRuntimeBinding,
  ResourceCallInReactHook,
  RunJsAstInspection,
  RunJsAuthoringContext,
  SourceBinding,
  SourceRange,
} from '../internal-types';
import type { RunJsAuthoringInspectionInput, RunJsAuthoringSurfaceStyle } from '../types';

type IndexedEntry = {
  index: number;
};

type CapabilityEntry = IndexedEntry & {
  capability: string;
};

export type RunJsScanResult = RunJsAstInspection & {
  blockRanges: SourceRange[];
  ctxAliases: Array<{ alias: string; index: number }>;
  ctxLibMemberCaseMismatches: CtxLibMemberCaseMismatch[];
  ctxMemberAccesses: Array<{ index: number; member: string }>;
  ctxRenderCalls: IndexedEntry[];
  ctxRenderComponentSignatureCalls: Array<CapabilityEntry & { component: string }>;
  ctxRequestCalls: IndexedEntry[];
  ctxRunjsCalls: IndexedEntry[];
  directDomAliases: Array<{ alias: string; index: number }>;
  directDomWrites: Array<IndexedEntry & { match: string }>;
  dynamicCtxAccesses: IndexedEntry[];
  forbiddenBareGlobals: Array<IndexedEntry & { name: string }>;
  functionRanges: SourceRange[];
  invalidCtxLibMemberAccesses: InvalidCtxLibMemberAccess[];
  invalidReactRuntimeBindings: InvalidReactRuntimeBinding[];
  isTopLevelFunctionWrapper: boolean;
  masked: string;
  reactComponentFunctionCalls: Array<CapabilityEntry & { component: string }>;
  reactComponentPropReferences: Array<CapabilityEntry & { component: string; prop: string }>;
  resourceCallsInReactHooks: ResourceCallInReactHook[];
  source: string;
  sourceBindings: SourceBinding[];
  topLevelCtxRenderCalls: IndexedEntry[];
  topLevelReactHookCalls: Array<IndexedEntry & { hook: string; match: string }>;
  topLevelReturns: IndexedEntry[];
  unboundReactCreateElementCalls: IndexedEntry[];
  windowDocumentNavigatorAliases: Array<{ alias: string; index: number; root: string }>;
  windowDocumentNavigatorUses: Array<IndexedEntry & { member: string; root: string }>;
};

export type RunJsInspectionRuntime = {
  context: RunJsAuthoringContext;
  input: RunJsAuthoringInspectionInput;
  modelUse: string;
  scan: RunJsScanResult;
  source: string;
  surface: string;
  surfaceStyle: RunJsAuthoringSurfaceStyle;
};

export type RunJsInspectionValidator = {
  id: string;
  validate(runtime: RunJsInspectionRuntime): FlowSurfaceErrorItemInput[];
};
