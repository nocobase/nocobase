/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 导出所有工具函数，保持向后兼容性

// 常量
export {
  BLOCK_GROUP_CONFIGS,
  BLOCK_TYPES,
  FLOW_ENGINE_NAMESPACE,
  MENU_KEYS,
  type BlockBuilderConfig,
} from './constants';

// 翻译相关
export { escapeT, getT, tExpr } from './translation';

// 异常类
export { FlowCancelSaveException, FlowExitException } from './exceptions';

// 流程定义相关
export { defineAction } from './flow-definitions';

// 继承检查
export { isInheritedFrom } from './inheritance';

// 参数解析器
export { resolveCreateModelOptions, resolveDefaultParams, resolveExpressions } from './params-resolvers';

// Schema 工具
export {
  compileUiSchema,
  resolveStepUiSchema,
  resolveStepDisabledInSettings,
  resolveUiMode,
  shouldHideStepInSettings,
} from './schema-utils';

// Runtime Context Steps 设置
export { setupRuntimeContextSteps } from './setupRuntimeContextSteps';

// Record Proxy 工具
export { createCollectionContextMeta } from './createCollectionContextMeta';
export { createAssociationAwareObjectMetaFactory, createAssociationSubpathResolver } from './associationObjectVariable';
export {
  buildRecordMeta,
  collectContextParamsForTemplate,
  createCurrentRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  createRecordMetaFactory,
  extractUsedVariableNames,
  extractUsedVariablePaths,
  inferRecordRef,
  type RecordParamsBuilder,
} from './variablesParams';

// Context 工具
export { extractPropertyPath, formatPathToVariable, isVariableExpression } from './context';

export { clearAutoFlowError, getAutoFlowError, setAutoFlowError, type AutoFlowError } from './autoFlowError';
export { parsePathnameToViewParams, type ViewParam } from './parsePathnameToViewParams';
export {
  decodeBase64Url,
  encodeBase64Url,
  isCompleteCtxDatePath,
  isCtxDatePathPrefix,
  isCtxDateExpression,
  parseCtxDateExpression,
  resolveCtxDatePath,
  serializeCtxDateValue,
} from './dateVariable';

// 安全全局对象（window/document）
export {
  createSafeDocument,
  createSafeWindow,
  createSafeNavigator,
  createSafeRunJSGlobals,
  runjsWithSafeGlobals,
} from './safeGlobals';

// RunJS value helpers
export { isRunJSValue, normalizeRunJSValue, extractUsedVariablePathsFromRunJS, type RunJSValue } from './runjsValue';

// RunJS helpers
export { resolveRunJSObjectValues } from './resolveRunJSObjectValues';

// RunJS 代码兼容预处理（{{ }}）与 JSX 编译
export { prepareRunJsCode, preprocessRunJsTemplates } from './runjsTemplateCompat';

// Ephemeral context helper（用于临时注入属性/方法，避免污染父级 ctx）
export { createEphemeralContext } from './createEphemeralContext';

// Filter helpers
export { pruneFilter } from './pruneFilter';
export { isBeforeRenderFlow } from './flows';

// Module URL resolver
export { resolveModuleUrl, isCssFile } from './resolveModuleUrl';
