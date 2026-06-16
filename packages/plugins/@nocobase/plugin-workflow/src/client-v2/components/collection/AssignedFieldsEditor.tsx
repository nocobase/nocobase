/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AssignFormModel } from '@nocobase/client-v2';
import { FlowModelRenderer, useFlowEngine, type MetaTreeNode } from '@nocobase/flow-engine';
import { Empty } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { useWorkflowVariableOptions } from '../../canvas/useWorkflowVariableOptions';
import { useT } from '../../locale';
import { parseCollectionName } from './utils';

type AssignedValues = Record<string, unknown>;

function normalizeAssignedValues(values: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(values ?? {}).map(([fieldName, fieldValue]) => [
      fieldName,
      fieldValue === undefined ? null : fieldValue,
    ]),
  );
}

function defineWorkflowMetaTreeGetter(model: unknown, getMetaTree: () => MetaTreeNode[]) {
  const context = (model as { context?: { defineMethod?: (name: string, fn: () => MetaTreeNode[]) => void } })?.context;
  context?.defineMethod?.('getPropertyMetaTree', getMetaTree);
}

function defineAssignFormMetaTreeGetters(model: AssignFormModel, getMetaTree: () => MetaTreeNode[]) {
  defineWorkflowMetaTreeGetter(model, getMetaTree);
  defineWorkflowMetaTreeGetter(model.subModels?.grid, getMetaTree);
  model.subModels?.grid?.subModels?.items?.forEach?.((item: unknown) => {
    defineWorkflowMetaTreeGetter(item, getMetaTree);
  });
}

function useAssignFormModel({
  collectionValue,
  value,
  workflowMetaTree,
  onChange,
}: {
  collectionValue?: string;
  value?: AssignedValues;
  workflowMetaTree: MetaTreeNode[];
  onChange?: (value: AssignedValues) => void;
}) {
  const flowEngine = useFlowEngine();
  const initialValueRef = useRef(value);
  initialValueRef.current = value;
  const [formModel, setFormModel] = useState<AssignFormModel | null>(null);
  const syncAssignedValues = useMemoizedFn((model: AssignFormModel) => {
    onChange?.(normalizeAssignedValues(model.getAssignedValues?.()));
  });

  useEffect(() => {
    const [dataSourceKey, collectionName] = parseCollectionName(collectionValue) as [string, string];
    if (!dataSourceKey || !collectionName) {
      setFormModel(null);
      return;
    }

    const model = flowEngine.createModel<AssignFormModel>({
      use: 'AssignFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey,
            collectionName,
          },
        },
      },
      subModels: {
        grid: {
          use: 'AssignFormGridModel',
        },
      },
    });
    const getMetaTree = () => workflowMetaTree;
    defineAssignFormMetaTreeGetters(model, getMetaTree);
    model.setInitialAssignedValues(normalizeAssignedValues(initialValueRef.current));
    defineAssignFormMetaTreeGetters(model, getMetaTree);

    const handleSync = () => syncAssignedValues(model);
    const handleSubModelAdded = (item: unknown) => {
      defineWorkflowMetaTreeGetter(item, getMetaTree);
      handleSync();
    };
    model.emitter.on('formValuesChange', handleSync);
    model.subModels?.grid?.emitter?.on('onSubModelAdded', handleSubModelAdded);
    model.subModels?.grid?.emitter?.on('onSubModelRemoved', handleSync);

    setFormModel(model);

    return () => {
      model.emitter.off('formValuesChange', handleSync);
      model.subModels?.grid?.emitter?.off('onSubModelAdded', handleSubModelAdded);
      model.subModels?.grid?.emitter?.off('onSubModelRemoved', handleSync);
      model.subModels?.grid?.subModels?.items?.forEach?.((item: { remove?: () => void }) => item.remove?.());
      model.subModels?.grid?.remove?.();
      model.remove();
    };
  }, [collectionValue, flowEngine, syncAssignedValues, workflowMetaTree]);

  return formModel;
}

export function AssignedFieldsEditor({
  collection,
  value,
  onChange,
}: {
  collection?: string;
  value?: AssignedValues;
  onChange?: (value: AssignedValues) => void;
}) {
  const t = useT();
  const workflowMetaTree = useWorkflowVariableOptions();
  const formModel = useAssignFormModel({ collectionValue: collection, value, workflowMetaTree, onChange });

  if (!collection) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please select collection first')} />;
  }

  if (!formModel) {
    return null;
  }

  return <FlowModelRenderer model={formModel} showFlowSettings />;
}

export default AssignedFieldsEditor;
