/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FieldAssignValueInput } from '@nocobase/client-v2';
import { FlowModelProvider, useFlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { Button, Dropdown, Empty, Form } from 'antd';
import type { MenuProps } from 'antd';
import { useWorkflowVariableOptions } from '../../canvas/useWorkflowVariableOptions';
import { useT } from '../../locale';
import { getCollection, getCollectionFields, hasFieldName, parseCollectionName } from './utils';

type AssignedValues = Record<string, unknown>;
type AssignedField = ReturnType<typeof getCollectionFields>[number] & { name: string };
type WorkflowVariableTree = ReturnType<typeof useWorkflowVariableOptions>;

const fieldItemClassName = css`
  position: relative;

  .ant-form-item-label > label {
    padding-right: 32px;
    font-weight: 600;
  }
`;

const fieldsetClassName = css`
  padding: 16px 20px;
  border: 1px solid var(--colorBorderSecondary, #f0f0f0);
  border-radius: 6px;
  background: var(--colorFillQuaternary, rgba(0, 0, 0, 0.02));
`;

function useCollectionContextModel(collectionValue: string | undefined, workflowVariableTree: WorkflowVariableTree) {
  const flowEngine = useFlowEngine();
  const [model, setModel] = useState<FlowModel | null>(null);

  useEffect(() => {
    const collection = getCollection(flowEngine.context.dataSourceManager, collectionValue);
    if (!collection) {
      setModel(null);
      return;
    }

    const [dataSourceKey] = parseCollectionName(collectionValue) as [string, string];
    const dataSource = dataSourceKey ? flowEngine.context.dataSourceManager?.getDataSource?.(dataSourceKey) : undefined;
    const nextModel = flowEngine.createModel<FlowModel>({ use: 'FlowModel' });
    nextModel.context.defineProperty('collection', { value: collection });
    if (dataSource) {
      nextModel.context.defineProperty('dataSource', { value: dataSource });
    }
    nextModel.context.defineProperty('blockModel', { value: nextModel });
    nextModel.context.defineMethod('getPropertyMetaTree', () => workflowVariableTree);

    setModel(nextModel);
    return () => {
      nextModel.remove();
    };
  }, [collectionValue, flowEngine, workflowVariableTree]);

  return model;
}

function normalizeAssignedValues(values: AssignedValues | undefined): AssignedValues {
  return Object.fromEntries(
    Object.entries(values ?? {}).map(([fieldName, fieldValue]) => [
      fieldName,
      fieldValue === undefined ? '' : fieldValue,
    ]),
  );
}

function getFieldTitle(field: AssignedField, t: (key: string) => string) {
  return t(field.uiSchema?.title ?? field.name);
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
  const flowEngine = useFlowEngine();
  const t = useT();
  const workflowVariableTree = useWorkflowVariableOptions();
  const contextModel = useCollectionContextModel(collection, workflowVariableTree);
  const fields = useMemo(
    () =>
      getCollectionFields(flowEngine.context.dataSourceManager, collection)
        .filter(hasFieldName)
        .filter((field) => !field.hidden && Boolean(field.uiSchema)) as AssignedField[],
    [collection, flowEngine],
  );
  const normalizedValue = useMemo(() => normalizeAssignedValues(value), [value]);
  const assignedFields = useMemo(() => {
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    return Object.keys(normalizedValue)
      .map((fieldName) => fieldsByName.get(fieldName))
      .filter(Boolean) as AssignedField[];
  }, [fields, normalizedValue]);
  const unassignedFields = useMemo(
    () => fields.filter((field) => !Object.prototype.hasOwnProperty.call(normalizedValue, field.name)),
    [fields, normalizedValue],
  );

  const updateValue = (fieldName: string, nextValue: unknown) => {
    onChange?.({ ...normalizedValue, [fieldName]: nextValue === undefined ? '' : nextValue });
  };

  const removeField = (fieldName: string) => {
    const { [fieldName]: _, ...rest } = normalizedValue;
    onChange?.(rest);
  };

  const menu = useMemo<MenuProps>(
    () => ({
      onClick: ({ key }) => {
        onChange?.({ ...normalizedValue, [String(key)]: '' });
      },
      style: {
        maxHeight: 300,
        overflowY: 'auto',
      },
      items: unassignedFields.map((field) => ({
        key: field.name,
        label: getFieldTitle(field, t),
      })),
    }),
    [normalizedValue, onChange, t, unassignedFields],
  );

  if (!collection) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please select collection first')} />;
  }

  if (!contextModel) {
    return null;
  }

  return (
    <FlowModelProvider model={contextModel}>
      <div className={fieldsetClassName}>
        {assignedFields.map((field) => (
          <div key={field.name} style={{ position: 'relative' }}>
            <Form.Item
              className={fieldItemClassName}
              label={getFieldTitle(field, t)}
              labelAlign="left"
              layout="vertical"
              colon
            >
              <FieldAssignValueInput
                key={field.name}
                targetPath={field.name}
                value={normalizedValue[field.name]}
                onChange={(nextValue) => updateValue(field.name, nextValue)}
              />
            </Form.Item>
            <Button
              aria-label={t('Remove field')}
              type="link"
              icon={<CloseCircleOutlined />}
              onClick={() => removeField(field.name)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                paddingInline: 0,
              }}
            />
          </div>
        ))}
        {unassignedFields.length ? (
          <Dropdown menu={menu} trigger={['click']}>
            <Button aria-label={t('Add field')} icon={<PlusOutlined />}>
              {t('Add field')}
            </Button>
          </Dropdown>
        ) : null}
      </div>
    </FlowModelProvider>
  );
}

export default AssignedFieldsEditor;
