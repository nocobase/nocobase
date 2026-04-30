/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useField } from '@formily/react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, Form, Input, Modal, Select, Space } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { NAMESPACE } from '../../locale';
import { getKanbanDefaultSortFieldName, getKanbanPreferredSortScopeKey } from '../utils';

type SortFieldOption = {
  label: string;
  value: string;
  scopeKey?: string;
  uiSchema?: {
    title?: string;
  };
};

type CollectionFieldMetadata = {
  name: string;
  interface?: string;
  foreignKey?: string;
  scopeKey?: string;
  uiSchema?: {
    title?: string;
  };
};

type GroupFieldOption = {
  label: string;
  value: string;
};

export const upsertKanbanCollectionFieldOptions = (
  fields: Record<string, any>[] = [],
  fieldData?: Record<string, any>,
) => {
  if (!fieldData?.name) {
    return fields;
  }

  const nextFields = [...fields];
  const existingIndex = nextFields.findIndex((field) => field?.name === fieldData.name);
  if (existingIndex >= 0) {
    nextFields[existingIndex] = {
      ...nextFields[existingIndex],
      ...fieldData,
    };
    return nextFields;
  }

  nextFields.push(fieldData);
  return nextFields;
};

export const KanbanCreateSortFieldSelect = (props: {
  sortFields?: SortFieldOption[];
  collectionFields?: CollectionFieldMetadata[];
  groupField?: GroupFieldOption;
  collectionName?: string;
  dataSource?: string;
  [key: string]: any;
}) => {
  const { sortFields = [], collectionFields = [], groupField, collectionName, dataSource, ...others } = props;
  const [form] = Form.useForm();
  const formField: any = useField();
  const settingsContext = useFlowSettingsContext<any>();
  const api = settingsContext?.api || settingsContext?.model?.context?.api;
  const [sortFieldOptions, setSortFieldOptions] = useState<SortFieldOption[]>(sortFields);
  const [dialogType, setDialogType] = useState<'create' | 'update'>();
  const [submitting, setSubmitting] = useState(false);
  const dialogZIndex = useMemo(() => {
    const context = settingsContext?.model?.context;
    const popupBaseZIndex = Number(context?.themeToken?.zIndexPopupBase) || 1000;
    const viewerZIndex = Number(context?.viewer?.getNextZIndex?.()) || 0;

    return Math.max(viewerZIndex + 1, popupBaseZIndex + 4100, 5100);
  }, [settingsContext]);
  const resolvedGroupField = groupField?.value
    ? settingsContext?.model?.collection?.getField?.(groupField.value)
    : undefined;
  const groupFieldSortScopeKey = useMemo(
    () => getKanbanPreferredSortScopeKey(resolvedGroupField) || groupField?.value,
    [groupField?.value, resolvedGroupField],
  );
  const groupFieldScopeOption = useMemo(() => {
    if (!groupField || !groupFieldSortScopeKey) {
      return [];
    }

    return [{ label: groupField.label, value: groupFieldSortScopeKey }];
  }, [groupField, groupFieldSortScopeKey]);
  const integerFields = useMemo(() => {
    return collectionFields.filter((field) => field.interface === 'integer');
  }, [collectionFields]);
  const translate = useCallback(
    (key: string, options?: any) => {
      return (
        settingsContext?.model?.translate?.(key, { ns: NAMESPACE, ...options }) ||
        settingsContext?.t?.(key, options) ||
        key
      );
    },
    [settingsContext],
  );
  const compile = useCallback(
    (source: any) => Schema.compile(source, { t: (key: string, options?: any) => translate(key, options) }),
    [translate],
  );

  useEffect(() => {
    setSortFieldOptions(sortFields);
  }, [sortFields]);

  const appendSortField = useCallback(
    (fieldData: any) => {
      const nextOption = {
        ...fieldData,
        value: fieldData.name,
        label: compile(fieldData?.uiSchema?.title || fieldData.name),
      };
      setSortFieldOptions((previousOptions) => {
        const currentOptions = previousOptions.length ? previousOptions : sortFields;
        return upsertKanbanCollectionFieldOptions(
          currentOptions as Record<string, any>[],
          nextOption,
        ) as SortFieldOption[];
      });
      formField.dataSource = upsertKanbanCollectionFieldOptions(
        (formField.dataSource || sortFields) as Record<string, any>[],
        nextOption,
      );
      formField.value = fieldData.name;

      const collection = settingsContext?.model?.collection as
        | { getFields?: () => Record<string, any>[]; setOption?: (key: string, value: any) => void; fieldsMap?: any }
        | undefined;
      if (collection?.setOption && collection?.getFields) {
        collection.setOption('fields', upsertKanbanCollectionFieldOptions(collection.getFields(), fieldData));
        collection.fieldsMap = undefined;
      }
    },
    [compile, formField, settingsContext?.model?.collection, sortFields],
  );

  const renderScopeKeyDescription = useCallback(
    (scopeKey?: string) => {
      const scopedField = scopeKey ? collectionFields.find((field) => field.name === scopeKey) : undefined;
      const isGroupFieldScope = Boolean(scopeKey && [groupField?.value, groupFieldSortScopeKey].includes(scopeKey));
      const scopedFieldSchemaTitle = scopedField?.uiSchema?.title;
      const scopedFieldTitle = isGroupFieldScope
        ? compile(groupField?.label || groupField?.value)
        : scopedFieldSchemaTitle
          ? compile(scopedFieldSchemaTitle)
          : undefined;

      return (
        <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
          (
          {scopedFieldTitle
            ? translate('Grouped sorting based on') + `「${scopedFieldTitle}」`
            : translate('Global sorting')}
          )
        </span>
      );
    },
    [collectionFields, compile, groupField?.label, groupField?.value, groupFieldSortScopeKey, translate],
  );

  const openSortFieldDialog = useCallback(
    (type: 'create' | 'update') => {
      form.resetFields();
      form.setFieldsValue(
        type === 'create'
          ? {
              name: getKanbanDefaultSortFieldName(groupField?.value),
              scopeKey: groupFieldSortScopeKey,
            }
          : {
              scopeKey: groupFieldSortScopeKey,
            },
      );
      setDialogType(type);
    },
    [form, groupField?.value, groupFieldSortScopeKey],
  );

  const closeSortFieldDialog = useCallback(() => {
    setDialogType(undefined);
    form.resetFields();
  }, [form]);

  const handleSubmitSortField = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const { data } =
        dialogType === 'create'
          ? await api.resource('collections.fields', collectionName).create({
              values: {
                type: 'sort',
                interface: 'sort',
                ...values,
              },
            })
          : await api.request({
              url: `dataSourcesCollections/${dataSource}.${collectionName}/fields:update?filterByTk=${values.field}`,
              method: 'post',
              data: { type: 'sort', interface: 'sort', ...values },
            });

      appendSortField(data.data);
      closeSortFieldDialog();
    } finally {
      setSubmitting(false);
    }
  }, [api, appendSortField, closeSortFieldDialog, collectionName, dataSource, dialogType, form]);

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          options={sortFieldOptions}
          {...others}
          disabled={!groupField}
          optionRender={({ label, data }) => {
            return (
              <Space>
                <span>{label}</span>
                {renderScopeKeyDescription(data.scopeKey)}
              </Space>
            );
          }}
        />
        <Button
          disabled={!groupField || !api || !collectionName}
          onClick={() => openSortFieldDialog(dataSource === 'main' ? 'create' : 'update')}
        >
          {translate('Add new')}
        </Button>
      </Space.Compact>
      <Modal
        title={translate('Create sort field')}
        open={!!dialogType}
        confirmLoading={submitting}
        onOk={() => void handleSubmitSortField()}
        onCancel={closeSortFieldDialog}
        destroyOnClose
        zIndex={dialogZIndex}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {dialogType === 'create' ? (
            <>
              <Form.Item
                name={['uiSchema', 'title']}
                label={translate('Field display name')}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label={translate('Field name')}
                rules={[
                  { required: true },
                  {
                    pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
                    message: translate(
                      'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
                    ),
                  },
                ]}
                extra={translate(
                  'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
                )}
              >
                <Input />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="field"
              label={translate('Convert the following integer fields to sorting fields')}
              rules={[{ required: true }]}
            >
              <Select
                options={integerFields.map((field) => ({
                  value: field.name,
                  label: compile(field.uiSchema?.title || field.name),
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="scopeKey" label={translate('Grouped sorting')}>
            <Select disabled options={groupFieldScopeOption} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
