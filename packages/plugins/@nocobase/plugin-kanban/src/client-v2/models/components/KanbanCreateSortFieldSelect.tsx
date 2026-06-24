/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { observer, useFlowContext, useFlowSettingsContext, useFlowStep } from '@nocobase/flow-engine';
import { Button, Form, Input, Modal, Select, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
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

type DialogMode = 'create' | 'update' | null;

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

export const upsertKanbanFlowCollectionField = (collection: any, fieldData?: Record<string, any>) => {
  if (!collection || !fieldData?.name) {
    return;
  }

  const currentFields =
    typeof collection.getFields === 'function' ? collection.getFields() : collection.options?.fields;
  const nextFields = upsertKanbanCollectionFieldOptions(currentFields || [], fieldData);

  collection.setOption?.('fields', nextFields);

  if (typeof collection.upsertFields === 'function') {
    collection.upsertFields([fieldData]);
  } else if (typeof collection.addField === 'function' && !collection.getField?.(fieldData.name)) {
    collection.addField(fieldData);
  }
};

const compileLabel = (flowSettingsContext: any, value?: string) => {
  if (!value) {
    return value;
  }
  return flowSettingsContext?.t?.(value) || value;
};

export const KanbanCreateSortFieldSelect = observer(
  (props: {
    value?: string | null;
    onChange?: (value: string | null) => void;
    sortFields?: SortFieldOption[];
    collectionFields?: CollectionFieldMetadata[];
    groupField?: GroupFieldOption;
    collectionName?: string;
    dataSource?: string;
    useGroupingFormValues?: boolean;
    allowClear?: boolean;
    disabled?: boolean;
    [key: string]: any;
  }) => {
    const {
      value,
      onChange,
      sortFields: sortFieldsProp = [],
      collectionFields: collectionFieldsProp = [],
      groupField: groupFieldProp,
      collectionName: collectionNameProp,
      dataSource: dataSourceProp,
      useGroupingFormValues,
      allowClear,
      disabled,
      ...others
    } = props;
    const t = useT();
    const flowContext = useFlowContext();
    const flowSettingsContext = useFlowSettingsContext<any>();
    const flowStep = useFlowStep();
    const model = flowSettingsContext?.model;
    const collection = model?.collection || flowSettingsContext?.collection;
    const stepParams = (flowStep?.params || {}) as any;
    const grouping = useGroupingFormValues ? stepParams.grouping || {} : {};
    const groupFieldName = useGroupingFormValues ? grouping.groupField : groupFieldProp?.value;
    const resolvedGroupField = groupFieldName ? collection?.getField?.(groupFieldName) : undefined;
    const collectionFields = useMemo(() => {
      if (!useGroupingFormValues) {
        return collectionFieldsProp;
      }

      if (typeof collection?.getFields === 'function') {
        return collection.getFields();
      }

      return collection?.fields || collection?.options?.fields || [];
    }, [collection, collectionFieldsProp, useGroupingFormValues]);
    const groupField = useMemo(() => {
      if (!useGroupingFormValues) {
        return groupFieldProp;
      }

      if (!groupFieldName) {
        return undefined;
      }

      const field = collectionFields.find((item) => item?.name === groupFieldName);
      return {
        label: compileLabel(flowSettingsContext, field?.uiSchema?.title || field?.name || groupFieldName),
        value: groupFieldName,
      };
    }, [collectionFields, flowSettingsContext, groupFieldName, groupFieldProp, useGroupingFormValues]);
    const sortFields = useMemo(() => {
      if (!useGroupingFormValues) {
        return sortFieldsProp;
      }

      if (!groupFieldName) {
        return [];
      }

      return typeof model?.getSortFieldCandidates === 'function' ? model.getSortFieldCandidates(groupFieldName) : [];
    }, [groupFieldName, model, sortFieldsProp, useGroupingFormValues]);
    const collectionName = useGroupingFormValues ? collection?.name : collectionNameProp;
    const dataSource = useGroupingFormValues ? collection?.dataSourceKey : dataSourceProp;
    const [createdSortFields, setCreatedSortFields] = useState<SortFieldOption[]>([]);
    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [dialogSubmitting, setDialogSubmitting] = useState(false);
    const [dialogForm] = Form.useForm();

    const sortFieldOptions = useMemo(() => {
      return createdSortFields.reduce(
        (options, field) =>
          upsertKanbanCollectionFieldOptions(options as Record<string, any>[], field) as SortFieldOption[],
        sortFields,
      );
    }, [createdSortFields, sortFields]);

    const groupFieldSortScopeKey = useMemo(
      () => getKanbanPreferredSortScopeKey(resolvedGroupField) || groupFieldName,
      [groupFieldName, resolvedGroupField],
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

    useEffect(() => {
      if (!value) {
        return;
      }

      const selectedFieldExists = sortFieldOptions.some((item) => item.value === value);
      if (!selectedFieldExists) {
        onChange?.(null);
      }
    }, [onChange, sortFieldOptions, value]);

    const reloadCollectionMetadata = async () => {
      const resolvedDataSource = dataSource || 'main';
      await model?.context?.dataSourceManager?.reloadDataSource?.(resolvedDataSource);
    };

    const appendSortField = (fieldData: any) => {
      const nextOption = {
        ...fieldData,
        value: fieldData.name,
        label: compileLabel(flowSettingsContext, fieldData?.uiSchema?.title || fieldData.name),
      };

      setCreatedSortFields((previousFields) => {
        return upsertKanbanCollectionFieldOptions(
          previousFields as Record<string, any>[],
          nextOption,
        ) as SortFieldOption[];
      });

      onChange?.(fieldData.name);
      upsertKanbanFlowCollectionField(collection, fieldData);
    };

    const openCreateDialog = () => {
      dialogForm.setFieldsValue({
        name: getKanbanDefaultSortFieldName(groupField?.value) || `f_${uid()}`,
        scopeKey: groupFieldSortScopeKey,
        uiSchema: { title: '' },
      });
      setDialogMode('create');
    };

    const openUpdateDialog = () => {
      dialogForm.setFieldsValue({
        field: undefined,
        scopeKey: groupFieldSortScopeKey,
      });
      setDialogMode('update');
    };

    const closeDialog = () => {
      if (dialogSubmitting) {
        return;
      }
      setDialogMode(null);
      dialogForm.resetFields();
    };

    const handleDialogSubmit = async () => {
      const values = await dialogForm.validateFields();
      setDialogSubmitting(true);

      try {
        if (dialogMode === 'create') {
          const { data } = await flowContext.api.resource('collections.fields', collectionName).create({
            values: {
              type: 'sort',
              interface: 'sort',
              ...values,
            },
          });
          appendSortField(data.data);
        }

        if (dialogMode === 'update') {
          const { data } = await flowContext.api.request({
            url: `dataSourcesCollections/${dataSource}.${collectionName}/fields:update?filterByTk=${values.field}`,
            method: 'post',
            data: { type: 'sort', interface: 'sort', ...values },
          });
          appendSortField(data.data);
        }

        await reloadCollectionMetadata();
        closeDialog();
      } finally {
        setDialogSubmitting(false);
      }
    };

    return (
      <>
        <Space.Compact style={{ width: '100%' }}>
          <Select
            {...others}
            allowClear={allowClear}
            options={sortFieldOptions}
            value={value}
            onChange={(nextValue) => onChange?.(nextValue ?? null)}
            disabled={disabled || !groupField}
            optionRender={({ label }) => {
              return (
                <Space>
                  <span>{label}</span>
                </Space>
              );
            }}
          />
          <Button
            disabled={disabled || !groupField}
            onClick={dataSource === 'main' ? openCreateDialog : openUpdateDialog}
          >
            {t('Add new')}
          </Button>
        </Space.Compact>
        <Modal
          open={dialogMode !== null}
          title={t('Create sort field')}
          onCancel={closeDialog}
          onOk={() => void handleDialogSubmit()}
          confirmLoading={dialogSubmitting}
          destroyOnClose
        >
          <Form form={dialogForm} layout="vertical">
            {dialogMode === 'create' ? (
              <>
                <Form.Item
                  name={['uiSchema', 'title']}
                  label={t('Field display name')}
                  rules={[{ required: true, message: t('Field display name') }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="name"
                  label={t('Field name')}
                  extra={t(
                    'Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.',
                  )}
                  rules={[
                    { required: true, message: t('Field name') },
                    {
                      pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
                      message: t('Support letters, numbers and underscores, must start with a letter.'),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </>
            ) : null}
            {dialogMode === 'update' ? (
              <Form.Item
                name="field"
                label={t('Convert the following integer fields to sorting fields')}
                rules={[{ required: true, message: t('Sorting field') }]}
              >
                <Select
                  options={integerFields.map((field) => ({
                    value: field.name,
                    label: compileLabel(flowSettingsContext, field.uiSchema?.title || field.name),
                  }))}
                />
              </Form.Item>
            ) : null}
            <Form.Item name="scopeKey" label={t('Grouped sorting')}>
              <Select disabled options={groupFieldScopeOption} />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  },
);
