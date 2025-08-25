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
  FLOW_ENGINE_NAMESPACE,
  BLOCK_TYPES,
  BLOCK_GROUP_CONFIGS,
  MENU_KEYS,
  type BlockBuilderConfig,
} from './constants';

// 翻译相关
export { getT, escapeT } from './translation';

// 异常类
export { FlowExitException } from './exceptions';

// 流程定义相关
export { mergeFlowDefinitions, defineAction } from './flow-definitions';

// 继承检查
export { isInheritedFrom } from './inheritance';

// 参数解析器
export { resolveDefaultParams, resolveCreateModelOptions, resolveExpressions } from './params-resolvers';

// Schema 工具
export { compileUiSchema, resolveStepUiSchema, resolveUiMode } from './schema-utils';

// Runtime Context Steps 设置
export { setupRuntimeContextSteps } from './setupRuntimeContextSteps';

// Record Proxy 工具
export { createRecordProxyContext, createCollectionContextMeta } from './createRecordProxyContext';

// Context 工具
export { extractPropertyPath, formatPathToVariable, isVariableExpression } from './context';

export { parsePathnameToViewParams, type ViewParam } from './parsePathnameToViewParams';
