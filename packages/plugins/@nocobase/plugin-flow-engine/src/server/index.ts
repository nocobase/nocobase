/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default } from './plugin';
export { inspectRunJsAuthoringCode } from './flow-surfaces/runjs-authoring';
export { FlowModelRepository } from './repository';
export { resolveVariablesBatch, resolveVariablesTemplate } from './variables/resolve';
export type {
  RunJSSourceAdapter,
  RunJSSourceAdapterRegistry,
  RunJSSourceAuthoringInspector,
  VscPermissionHook,
  VscPermissionHookRegistry,
} from '@nocobase/runjs-workspace/server';
export {
  bootstrapFlowSurfaceRunJSWorkspace,
  buildFlowSurfaceRunJSLocator,
  registerFlowSurfaceRunJSWorkspaceBootstrapPort,
  type FlowSurfaceRunJSLocator,
  type FlowSurfaceRunJSAuthoringContext,
  type FlowSurfaceRunJSWorkspaceBootstrapInput,
  type FlowSurfaceRunJSWorkspaceBootstrapPort,
  type FlowSurfaceRunJSWorkspaceBootstrapResult,
  type FlowSurfaceRunJSWorkspaceStatus,
} from './flow-surfaces/page-surface-contract';
export {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  RecordSlotResolverRegistry,
} from './variables/record-slot-resolvers';
export type {
  RecordSlotResolved,
  RecordSlotResolverInput,
  RecordSlotResolverRegistration,
  RecordSlotResolverResult,
} from './variables/record-slot-resolvers';
