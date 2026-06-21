/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext } from 'react';

import { Variable, useApp, useCompile, useGlobalVariable, usePlugin } from '@nocobase/client';

import WorkflowPlugin from '.';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { useAvailableUpstreams, useNodeContext, useUpstreamScopes } from './nodes';

// The field-tree builder + its shared constants/types now live in client-v2 and are shared by both canvases (ADR-0003).
// Re-exported here so existing v1 import sites (`from '../variable'`) are unchanged. Delete on legacy-canvas
// retirement.
export { getCollectionFieldOptions, BaseTypeSets, defaultFieldNames } from '../client-v2/canvas/collectionFieldOptions';
export type { VariableOption, VariableDataType, UseVariableOptions } from '../client-v2/canvas/collectionFieldOptions';
import {
  getCollectionFieldOptions,
  defaultFieldNames,
  type VariableOption,
  type UseVariableOptions,
} from '../client-v2/canvas/collectionFieldOptions';

export const nodesOptions = {
  label: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
  value: '$jobsMapByNodeKey',
  useOptions(options: UseVariableOptions) {
    const { instructions } = usePlugin(WorkflowPlugin);
    const current = useNodeContext();
    const upstreams = useAvailableUpstreams(current);
    const result: VariableOption[] = [];
    upstreams.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOption = instruction.useVariables?.(node, options);
      if (subOption) {
        result.push(subOption);
      }
    });
    return result;
  },
};

export const triggerOptions = {
  label: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
  value: '$context',
  useOptions(options: UseVariableOptions) {
    const { triggers } = usePlugin(WorkflowPlugin);
    const { workflow } = useFlowContext();
    const trigger = triggers.get(workflow.type);
    return trigger?.useVariables?.(workflow.config, options) ?? null;
  },
};

export const scopeOptions = {
  label: `{{t("Scope variables", { ns: "${NAMESPACE}" })}}`,
  value: '$scopes',
  useOptions(options: UseVariableOptions & { current: any }) {
    const { fieldNames = defaultFieldNames, current } = options;
    const { instructions } = usePlugin(WorkflowPlugin);
    const source = useNodeContext();
    const from = current ?? source;
    const scopes = useUpstreamScopes(from);
    const result: VariableOption[] = [];
    scopes.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOptions = instruction.useScopeVariables?.(node, options);
      if (subOptions) {
        result.push({
          key: node.key,
          [fieldNames.value]: node.key,
          [fieldNames.label]: node.title ?? `#${node.id}`,
          [fieldNames.children]: subOptions,
        });
      }
    });
    return result;
  },
};

export const systemOptions = {
  label: `{{t("System variables", { ns: "${NAMESPACE}" })}}`,
  value: '$system',
  useOptions(options: UseVariableOptions) {
    const { systemVariables } = usePlugin(WorkflowPlugin);
    const compile = useCompile();
    return compile(Array.from(systemVariables.getValues()));
  },
};

function useOptions(scope, opts) {
  const compile = useCompile();
  const children = scope.useOptions?.(opts)?.filter(Boolean);
  const { fieldNames } = opts;
  return {
    [fieldNames.label]: compile(scope.label),
    [fieldNames.value]: scope.value,
    key: scope[fieldNames.value],
    [fieldNames.children]: children,
    disabled: !children || !children.length,
  };
}

export function useWorkflowVariableOptions(
  options: UseVariableOptions = {},
  preset: VariableOption[] = [],
): VariableOption[] {
  const fieldNames = Object.assign({}, defaultFieldNames, options.fieldNames ?? {});
  const opts = Object.assign(options, { fieldNames });
  const result = [
    ...preset,
    useOptions(scopeOptions, opts),
    useOptions(nodesOptions, opts),
    useOptions(triggerOptions, opts),
    useOptions(systemOptions, opts),
    useGlobalVariable('$env'),
  ].filter(Boolean);
  // const cache = useMemo(() => result, [result]);
  return result;
}

export function useGetDataSourceCollectionManager(dataSourceName?) {
  const app = useApp();
  const { collectionManager } = app.dataSourceManager.getDataSource(dataSourceName);

  return collectionManager;
}

export function WorkflowVariableInput({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.Input scope={scope} {...props} />;
}

export function WorkflowVariableTextArea({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.TextArea scope={scope} {...props} />;
}

export function WorkflowVariableRawTextArea({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.RawTextArea scope={scope} {...props} />;
}

export function WorkflowVariableJSON({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.JSON scope={scope} {...props} />;
}

/**
 * @experimental
 */
export function WorkflowVariableWrapper(props): JSX.Element {
  const { render, variableOptions, changeOnSelect, nullable, ...others } = props;
  const hideVariable = useHideVariable();
  const scope = useWorkflowVariableOptions(variableOptions);

  if (!hideVariable && scope?.length > 0) {
    return (
      <Variable.Input scope={scope} changeOnSelect={changeOnSelect} nullable={nullable} {...others}>
        {render?.(others)}
      </Variable.Input>
    );
  }

  return render?.(others);
}

/**
 * @experimental
 */
export const HideVariableContext = createContext(false);

/**
 * @experimental
 */
export function useHideVariable() {
  return useContext(HideVariableContext);
}
