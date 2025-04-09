/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default as useBuiltinVariables } from './hooks/useBuiltinVariables';
export { default as useContextVariable } from './hooks/useContextVariable';
export { default as useLocalVariables } from './hooks/useLocalVariables';
export { default as useVariables } from './hooks/useVariables';
export * from './utils/isVariable';
export * from './utils/transformVariableValue';
export { VariablesContext, default as VariablesProvider } from './VariablesProvider';

export * from './constants';
export type { VariablesContextType } from './types';

export * from './context/EvaluateContext';
