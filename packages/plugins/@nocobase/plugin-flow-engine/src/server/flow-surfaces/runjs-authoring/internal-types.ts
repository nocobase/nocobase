/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

export type RunJsAuthoringContext = {
  authoringActionName?: FlowSurfaceAuthoringWriteAction;
  applyBlueprintScriptAssets?: Record<string, any>;
  currentCollectionName?: string;
  currentDataSourceKey?: string;
  currentNode?: any;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  hostBlockType?: string;
  hostCollectionName?: string;
  hostDataSourceKey?: string;
  runJsSourceBudget?: RunJsSourceBudget;
};

export type RunJsCodeSource = {
  code: string;
  path: string;
};

export type PlainRecord = Record<string, any>;

export type SourceRange = {
  start: number;
  end: number;
};

export type SourceBinding = SourceRange & {
  declarationStart?: number;
  executionScope?: SourceRange;
  name: string;
};

export type StringLiteralBinding = SourceBinding & {
  value: string;
};

export type StaticStringBinding = StringLiteralBinding;

export type StaticFilterValueBinding = SourceBinding & {
  declarationStart: number;
  executionScope: SourceRange;
  valueNode: any;
};

export type AstIdentifierWrite = {
  alwaysRunsInExecutionScope: boolean;
  executionScope: SourceRange;
  index: number;
  name: string;
};

export type AstStaticObjectAliasCopy = SourceRange & {
  declarationStart: number;
  executionScope: SourceRange;
  name: string;
  sourceName: string;
};

export type ReactComponentAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

export type ReactAsyncComponentBinding = SourceRange & {
  capability: string;
  component: string;
  declarationStart?: number;
  name: string;
};

export type ReactCreateElementAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

export type ReactNamespaceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  precedenceStart?: number;
};

export type ReactDefaultAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  precedenceStart?: number;
};

export type AstCapabilityAlias = SourceRange & {
  capability: string;
  name: string;
  precedenceStart?: number;
};

export const AST_DYNAMIC_MEMBER_ALIAS = '[*]';

export type InvalidReactRuntimeBinding = SourceRange & {
  binding: string;
  capability: string;
  declarationStart?: number;
  index: number;
  ruleId: 'runjs-react-default-alias-forbidden';
};

export type FlowResourceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

export type FlowResourceInstanceType =
  | 'unknown'
  | 'FlowResource'
  | 'APIResource'
  | 'SingleRecordResource'
  | 'MultiRecordResource'
  | 'SQLResource';

export type AstFlowResourceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  resourceType: FlowResourceInstanceType;
};

export type AstFlowResourceSource = {
  capability: string;
  index: number;
  resourceType: FlowResourceInstanceType;
};

export type AstRunJsResourceState = {
  capability: string;
  collectionName?: string;
  dataSourceKey: string;
  resourceType: FlowResourceInstanceType;
};

export type CtxLibMemberCaseMismatch = {
  accessKind: 'bracket' | 'destructure' | 'member';
  capability: string;
  expectedCapability: string;
  expectedMember: string;
  index: number;
  member: string;
};

export type InvalidCtxLibMemberAccess = {
  accessKind: 'bracket' | 'destructure' | 'member';
  capability: string;
  index: number;
  library: string;
  member: string;
  ruleId: 'runjs-ctx-libs-member-unknown';
  suggestedImport?: string;
};

export type CallArgumentSource = SourceRange & {
  source: string;
};

export type ResourceCallInReactHook = {
  capability: string;
  hook: string;
  index: number;
};

export type SharedCtxResourceCallInFunction = {
  capability: string;
  functionName?: string;
  index: number;
};

export type RunJsSourceBudget = {
  count: number;
  countLimitReported?: boolean;
  totalLength: number;
  totalLimitReported?: boolean;
};

export type RunJsAstInspection = {
  invalidApiResourceCalls: Array<{
    index: number;
    match: string;
    matchIndex?: number;
    method: string;
  }>;
  invalidResourceActionCalls: Array<{
    actionName: string;
    allowedActions?: string[];
    capability: string;
    collectionName?: string;
    dataSourceKey?: string;
    endpoint?: string;
    index: number;
    invalidReason: string;
    resourceType?: FlowResourceInstanceType;
    suggestedMethod?: string;
  }>;
  invalidCtxApiMemberAccesses: Array<{
    capability: string;
    index: number;
    match?: string;
    matchIndex?: number;
    member?: string;
    ruleId: string;
  }>;
  invalidCtxNonFunctionCalls: Array<{
    capability: string;
    index: number;
    member: string;
    ruleId: 'runjs-ctx-member-not-callable';
  }>;
  invalidCtxLibMemberAccesses: InvalidCtxLibMemberAccess[];
  invalidResourceTypeCalls: Array<{
    capability: string;
    expression?: string;
    index: number;
    resourceType?: string;
    ruleId: string;
  }>;
  invalidFlowResourceListCalls: Array<{
    capability: string;
    index: number;
  }>;
  invalidFlowResourceMethodCalls: Array<{
    capability: string;
    index: number;
    method: string;
    resourceType?: FlowResourceInstanceType;
    suggestedMethod?: string;
  }>;
  invalidResourceFilterCalls: Array<{
    availableFields?: string[];
    capability: string;
    collectionName?: string;
    dataSourceKey?: string;
    fieldInterface?: string;
    fieldPath?: string;
    fieldType?: string;
    invalidShape?: string;
    index: number;
    invalidReason?: string;
    invalidValue?: any;
    message: string;
    operator?: string;
    repairExample?: Record<string, any>;
    repairHint?: string;
    resourceType?: FlowResourceInstanceType;
    ruleId: string;
    unsupportedKeys?: string[];
    suggestedOperator?: string;
    suggestedValue?: any;
    examples?: Record<string, any>;
  }>;
  nestedRunjsCalls: Array<{
    capability: string;
    index: number;
  }>;
  invalidReactRuntimeBindings: InvalidReactRuntimeBinding[];
  reactAsyncComponentReferences: Array<{
    capability: string;
    component: string;
    index: number;
  }>;
  reactComponentCtxRenderCalls: Array<{
    capability: string;
    component: string;
    index: number;
  }>;
  sharedCtxResourceCallsInFunctions: SharedCtxResourceCallInFunction[];
  topLevelReachableCtxRenderCalls: Array<{
    capability: string;
    index: number;
  }>;
};

export type CtxMethodAlias = SourceRange & {
  capability: string;
  method: string;
  name: string;
};

export type CtxRootAlias = SourceRange & {
  capability: 'ctx';
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

export type CtxNonFunctionRootAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  member: string;
  name: string;
};

export type CtxLibsRootAlias = SourceRange & {
  capability: 'ctx.libs';
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

export type CtxLibAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  library: string;
  name: string;
};

export type CtxApiCapability =
  | 'ctx.api'
  | 'ctx.api.auth'
  | 'ctx.api.request'
  | 'ctx.api.resource'
  | `ctx.api.auth.${string}`;

export type CtxApiAlias = SourceRange & {
  capability: CtxApiCapability;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

export type CtxApiResourceHandleAlias = SourceRange & {
  calleeSource: string;
  dataSourceKey?: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  resourceName?: string;
};

export type CtxApiResourceMethodAlias = SourceRange & {
  declarationStart?: number;
  executionScope: SourceRange;
  method: string;
  name: string;
};

export type CtxApiResourceAliases = {
  handles: CtxApiResourceHandleAlias[];
  methods: CtxApiResourceMethodAlias[];
};

export type AstIdentifierBinding = SourceRange & {
  declarationStart?: number;
  name: string;
  unavailableRanges?: SourceRange[];
};

export type AstFunctionBinding = SourceRange & {
  declarationStart: number;
  functionNode: any;
  hoisted: boolean;
  name: string;
  scopeStart: number;
};

export type AstCtxRenderCall = {
  args: any[];
  capability: string;
  index: number;
};
