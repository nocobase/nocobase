/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useFlowEngine } from '@nocobase/flow-engine';
import { Cascader, Form } from 'antd';
import type { CascaderProps } from 'antd';
import {
  getCollection,
  joinCollectionName,
  parseCollectionName,
  useAvailableUpstreams,
  useCurrentWorkflowContext,
  useNodeContext,
  type CollectionTriggerField,
  type Instruction,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';
import type { AggregateAssociationConfig } from '../types';
import { getAssociatedPath, matchToManyField } from '../utils';

const NODE_RESULT_ROOT = '$jobsMapByNodeKey';
const TRIGGER_ROOT = '$context';

type FieldWithDataSource = CollectionTriggerField & {
  collectionName?: string;
  dataSourceKey?: string;
  options?: FieldWithDataSource;
};

type WorkflowTriggerLike = {
  useVariables?: (config: unknown, options?: UseVariableOptions) => VariableOption[] | null | undefined;
};

type WorkflowPluginLike = {
  instructions?: { get: (type?: string) => Instruction | undefined };
  triggers?: { get: (type?: string) => WorkflowTriggerLike | undefined };
};

type AssociatedCascaderOption = {
  appends?: string[] | null;
  depth?: number;
  key?: string;
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
  isLeaf?: boolean;
  field?: FieldWithDataSource;
  loadChildren?: ((option: AssociatedCascaderOption) => Promise<void> | void) | null;
  types?: UseVariableOptions['types'];
  children?: AssociatedCascaderOption[];
};

type CollectionFieldSource = FieldWithDataSource | { options?: FieldWithDataSource };

type CollectionLike = {
  getFields?: () => CollectionFieldSource[];
  fields?: CollectionFieldSource[] | Map<string, CollectionFieldSource>;
};

function normalizeField(field: FieldWithDataSource | { options?: FieldWithDataSource }): FieldWithDataSource {
  return ('options' in field && field.options ? field.options : field) as FieldWithDataSource;
}

function getDataSourceKeyFromCollection(collection?: string | null) {
  const [dataSourceKey] = parseCollectionName(collection ?? '') as [string, string];
  return dataSourceKey || 'main';
}

function getOptionsSignature(options: AssociatedCascaderOption[]) {
  return options
    .map((option) => `${option.value}:${option.children?.map((child) => child.value).join(',') ?? ''}`)
    .join('|');
}

function getOptionValue(option: VariableOption): string {
  const value = option.value ?? option.key;
  return typeof value === 'string' ? value : String(value ?? '');
}

function compileLabel(label: React.ReactNode, compile: (key: string, options?: Record<string, unknown>) => string) {
  return typeof label === 'string' ? compile(label, { ns: ['workflow', 'workflow-aggregate', 'client'] }) : label;
}

function toCascaderOption(
  option: VariableOption,
  compile: (key: string, options?: Record<string, unknown>) => string,
  fallbackDataSourceKey: string,
): AssociatedCascaderOption {
  const rawField = option.field ? normalizeField(option.field as FieldWithDataSource) : undefined;
  const field = rawField ? { ...rawField, dataSourceKey: rawField.dataSourceKey ?? fallbackDataSourceKey } : undefined;
  const nextFallbackDataSourceKey = field?.dataSourceKey ?? fallbackDataSourceKey;
  const loadChildren =
    typeof option.loadChildren === 'function'
      ? async (target: AssociatedCascaderOption) => {
          await option.loadChildren?.(target);
          target.children = Array.isArray(target.children)
            ? (target.children as unknown as VariableOption[]).map((child) =>
                toCascaderOption(child, compile, nextFallbackDataSourceKey),
              )
            : undefined;
        }
      : undefined;

  return {
    appends: option.appends as string[] | null | undefined,
    depth: option.depth as number | undefined,
    key: option.key,
    value: getOptionValue(option),
    label: compileLabel(option.label, compile),
    disabled: Boolean(option.disabled),
    isLeaf: Boolean(option.isLeaf),
    field,
    loadChildren,
    types: option.types as UseVariableOptions['types'] | undefined,
    children: Array.isArray(option.children)
      ? option.children.map((child) => toCascaderOption(child, compile, nextFallbackDataSourceKey))
      : undefined,
  };
}

function createRootOption({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: AssociatedCascaderOption[];
}): AssociatedCascaderOption {
  return {
    key: value,
    value,
    label,
    children,
    disabled: !children.length,
  };
}

function useAssociatedFields() {
  const flowEngine = useFlowEngine();
  const current = useNodeContext();
  const workflow = useCurrentWorkflowContext();
  const upstreams = useAvailableUpstreams(current);
  const workflowPlugin = (flowEngine.context.app.pm.get('workflow') ||
    flowEngine.context.app.pm.get('@nocobase/plugin-workflow')) as WorkflowPluginLike | undefined;
  const compile = (key: string, options?: Record<string, unknown>) => flowEngine.context.t(key, options);
  const variableOptions: UseVariableOptions = {
    types: [matchToManyField],
    appends: null,
    depth: 4,
  };

  const nodeChildren: AssociatedCascaderOption[] = [];
  upstreams.forEach((node: { type?: string; config?: { collection?: string } }) => {
    const instruction = workflowPlugin?.instructions?.get(node.type);
    const option = instruction?.useVariables?.(node, variableOptions);
    if (!option) {
      return;
    }
    nodeChildren.push(toCascaderOption(option, compile, getDataSourceKeyFromCollection(node.config?.collection)));
  });

  const trigger = workflow?.type ? workflowPlugin?.triggers?.get(workflow.type) : undefined;
  const triggerOptions = trigger?.useVariables?.(workflow?.config, variableOptions);
  const triggerChildren = Array.isArray(triggerOptions)
    ? triggerOptions
        .filter(Boolean)
        .map((option) =>
          toCascaderOption(option, compile, getDataSourceKeyFromCollection(workflow?.config?.collection)),
        )
    : [];

  return [
    createRootOption({
      label: compile('Node result', { ns: 'workflow' }),
      value: NODE_RESULT_ROOT,
      children: nodeChildren,
    }),
    createRootOption({
      label: compile('Trigger variables', { ns: 'workflow' }),
      value: TRIGGER_ROOT,
      children: triggerChildren,
    }),
  ];
}

function getCollectionFields(collection?: CollectionLike): CollectionFieldSource[] {
  const fields = collection?.getFields?.() ?? collection?.fields ?? [];
  return fields instanceof Map ? Array.from(fields.values()) : fields;
}

function getPrimaryKeyName(collection?: CollectionLike) {
  const fields = getCollectionFields(collection);
  const primaryKeyField = fields.map(normalizeField).find((field) => field.primaryKey);
  return primaryKeyField?.name ?? 'id';
}

async function loadOptionChildren(option: AssociatedCascaderOption) {
  if (!option.children?.length && !option.isLeaf && option.loadChildren) {
    await option.loadChildren(option);
  }
}

function clearAggregateParams(form: ReturnType<typeof Form.useFormInstance>) {
  form.setFieldValue(['config', 'params', 'field'], null);
  form.setFieldValue(['config', 'params', 'filter'], null);
}

function clearAssociatedSelection(
  form: ReturnType<typeof Form.useFormInstance>,
  onChange?: (value: AggregateAssociationConfig) => void,
) {
  form.setFieldValue(['config', 'collection'], null);
  clearAggregateParams(form);
  onChange?.({});
}

export function AssociatedConfig({
  value,
  onChange,
  onDropdownVisibleChange,
  ...props
}: Omit<
  CascaderProps<AssociatedCascaderOption, 'value', false>,
  'loadData' | 'multiple' | 'onChange' | 'options' | 'value'
> & {
  value?: AggregateAssociationConfig | null;
  onChange?: (value: AggregateAssociationConfig) => void;
}) {
  const flowEngine = useFlowEngine();
  const form = Form.useFormInstance();
  const baseOptions = useAssociatedFields();
  const baseOptionsSignature = getOptionsSignature(baseOptions);
  const [options, setOptions] = useState(baseOptions);
  const selectedPath = getAssociatedPath(value);
  const selectedPathSignature = selectedPath.join('.');
  const [activePath, setActivePath] = useState<string[]>(selectedPath);

  useEffect(() => {
    setOptions(baseOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the selectable variable tree changes.
  }, [baseOptionsSignature]);

  useEffect(() => {
    setActivePath(selectedPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedPathSignature is the stable value identity.
  }, [selectedPathSignature]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedPath = async () => {
      if (!selectedPath.length || !options.length) {
        return;
      }

      let currentOptions = options;
      let currentOption: AssociatedCascaderOption | undefined;
      let resolved = true;
      for (const key of selectedPath) {
        currentOption = currentOptions.find((option) => option.value === key);
        if (!currentOption) {
          resolved = false;
          break;
        }
        await loadOptionChildren(currentOption);
        currentOptions = currentOption.children ?? [];
      }

      if (cancelled) {
        return;
      }

      if (resolved && currentOption?.field && !matchToManyField(currentOption.field)) {
        clearAssociatedSelection(form, onChange);
        return;
      }

      setOptions([...options]);
    };

    loadSelectedPath();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches the legacy one-time lazy-load behavior for existing values.
  }, [selectedPathSignature, options.length]);

  return (
    <Cascader
      {...props}
      value={activePath}
      options={options}
      changeOnSelect
      loadData={async (selectedOptions) => {
        const option = selectedOptions[selectedOptions.length - 1] as AssociatedCascaderOption | undefined;
        if (!option) {
          return;
        }
        await loadOptionChildren(option);
        setOptions([...options]);
      }}
      onDropdownVisibleChange={(open) => {
        if (!open) {
          setActivePath(selectedPath);
        }
        onDropdownVisibleChange?.(open);
      }}
      onChange={(path, selectedOptions) => {
        setActivePath(path as string[]);
        if (!path?.length) {
          clearAssociatedSelection(form, onChange);
          return;
        }

        const option = selectedOptions[selectedOptions.length - 1] as AssociatedCascaderOption | undefined;
        const field = option?.field;
        if (!field || !matchToManyField(field) || !field.collectionName || !field.target || !field.name) {
          return;
        }

        const dataSourceKey = field.dataSourceKey ?? 'main';
        const sourceCollection = joinCollectionName(dataSourceKey, field.collectionName);
        const primaryKeyName = getPrimaryKeyName(
          getCollection(flowEngine.context.dataSourceManager, sourceCollection) as unknown as
            | CollectionLike
            | undefined,
        );

        form.setFieldValue(['config', 'collection'], joinCollectionName(dataSourceKey, field.target));
        clearAggregateParams(form);
        onChange?.({
          name: field.name,
          associatedKey: `{{${path.slice(0, -1).join('.')}.${primaryKeyName}}}`,
          associatedCollection: sourceCollection,
        });
      }}
    />
  );
}

export default AssociatedConfig;
