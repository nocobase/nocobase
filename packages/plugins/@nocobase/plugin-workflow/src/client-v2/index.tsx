/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default, PluginWorkflowClientV2 } from './plugin';
export * from './models';

// Workflow node extension contract (shared base class + canvas building blocks) for downstream node plugins migrating
// their config UI to the modern canvas.
export { Instruction } from './canvas/Instruction';
export type { LoaderOf, NodeAvailableContext, TempAssociationSource } from './canvas/Instruction';
export { WorkflowVariableInput } from './canvas/WorkflowVariableInput';
export type { WorkflowVariableInputProps } from './canvas/WorkflowVariableInput';
export { WorkflowTypedVariableInput, WORKFLOW_TYPED_CONSTANT_TYPES } from './canvas/WorkflowTypedVariableInput';
export type { WorkflowTypedVariableInputProps } from './canvas/WorkflowTypedVariableInput';
export { useWorkflowVariableOptions } from './canvas/useWorkflowVariableOptions';
export { Trigger } from './triggers';
export type { LoaderOf as TriggerLoaderOf, TriggerTempAssociationSource } from './triggers';
export * from './components/collection';
export { FilterDynamicComponent, ConditionField } from './components/FilterDynamicComponent';
