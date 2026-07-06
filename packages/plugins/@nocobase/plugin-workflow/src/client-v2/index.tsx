/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default, PluginWorkflowClientV2 } from './plugin';
export * from './constants';
export * from './taskCenter';
export * from './models';

// Workflow node extension contract (shared base class + canvas building blocks) for downstream node plugins migrating
// their config UI to the modern canvas.
export { Instruction, useAvailableUpstreams, useNodeContext } from './canvas/Instruction';
export type { LoaderOf, NodeAvailableContext, TempAssociationSource } from './canvas/Instruction';
export { Branch } from './canvas/Branch';
export { NodeDefaultView } from './canvas/Node';
export { useCurrentWorkflowContext, useFlowContext, WorkflowVariableSourceContext } from './canvas/contexts';
export type { CanvasNode } from './canvas/contexts';
export { default as useStyles } from './canvas/style';
export { WorkflowVariableInput } from './canvas/WorkflowVariableInput';
export type { WorkflowVariableInputProps } from './canvas/WorkflowVariableInput';
export { WorkflowVariableTag } from './canvas/WorkflowVariableTag';
export type { WorkflowVariableTagProps } from './canvas/WorkflowVariableTag';
export { WorkflowVariableTextArea } from './canvas/WorkflowVariableTextArea';
export type { WorkflowVariableTextAreaProps } from './canvas/WorkflowVariableTextArea';
export { WorkflowVariableJsonTextArea } from './canvas/WorkflowVariableJsonTextArea';
export type { WorkflowVariableJsonTextAreaProps } from './canvas/WorkflowVariableJsonTextArea';
export { HideVariableContext, useHideVariable } from './components/HideVariableContext';
export { WorkflowVariableWrapper } from './components/WorkflowVariableWrapper';
export type { WorkflowVariableWrapperProps } from './components/WorkflowVariableWrapper';
export { WorkflowTypedVariableInput, WORKFLOW_TYPED_CONSTANT_TYPES } from './canvas/WorkflowTypedVariableInput';
export type { WorkflowTypedVariableInputProps } from './canvas/WorkflowTypedVariableInput';
export { useWorkflowVariableOptions } from './canvas/useWorkflowVariableOptions';
export type { UseWorkflowVariableOptions } from './canvas/useWorkflowVariableOptions';
export { CurrentWorkflowContext } from './canvas/contexts';
export { getCollectionFieldOptions } from './canvas/collectionFieldOptions';
export { BaseTypeSets, defaultFieldNames } from './canvas/collectionFieldOptions';
export type { UseVariableOptions, VariableOption } from './canvas/collectionFieldOptions';
export { CalculationConfig } from './components/Calculation';
export type { CalculationConfigProps } from './components/Calculation';
export { RadioWithTooltip } from './components/RadioWithTooltip';
export type { RadioWithTooltipOption, RadioWithTooltipProps } from './components/RadioWithTooltip';
export { renderEngineReference } from './components/renderEngineReference';
export { Trigger } from './triggers';
export type { LoaderOf as TriggerLoaderOf, TriggerTempAssociationSource } from './triggers';
export * from './components/collection';
export { FilterDynamicComponent, ConditionField } from './components/FilterDynamicComponent';
