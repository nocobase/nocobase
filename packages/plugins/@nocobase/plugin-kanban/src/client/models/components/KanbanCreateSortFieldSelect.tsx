/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext, useField } from '@formily/react';
import {
  APIClientProvider,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  Select,
  useAPIClient,
  useCompile,
  useGlobalTheme,
} from '@nocobase/client';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const formField: any = useField();
  const compile = useCompile();
  const api = useAPIClient();
  const { t } = useTranslation();
  const { theme } = useGlobalTheme();
  const schemaOptions = useContext(SchemaOptionsContext);
  const flowSettingsContext = useFlowSettingsContext<any>();
  const flowSettings = flowSettingsContext?.model?.context?.engine?.flowSettings;
  const [sortFieldOptions, setSortFieldOptions] = useState<SortFieldOption[]>(sortFields);
  const resolvedGroupField = groupField?.value
    ? flowSettingsContext?.model?.collection?.getField?.(groupField.value)
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

  useEffect(() => {
    setSortFieldOptions(sortFields);
  }, [sortFields]);

  const dialogScope = useMemo(() => {
    return {
      ...(schemaOptions?.scope || {}),
      ...(flowSettings?.scopes || {}),
      useFlowSettingsContext,
    };
  }, [flowSettings?.scopes, schemaOptions?.scope]);

  const dialogComponents = useMemo(() => {
    return {
      ...(schemaOptions?.components || {}),
      ...(flowSettings?.components || {}),
    };
  }, [flowSettings?.components, schemaOptions?.components]);

  const renderScopeKeyDescription = (scopeKey?: string) => {
    const scopedField = scopeKey ? collectionFields.find((field) => field.name === scopeKey) : undefined;
    const isGroupFieldScope = Boolean(scopeKey && [groupField?.value, groupFieldSortScopeKey].includes(scopeKey));
    const scopedFieldSchemaTitle = scopedField?.uiSchema?.title;
    const scopedFieldTitle = isGroupFieldScope
      ? groupField?.label
      : scopedFieldSchemaTitle
        ? compile(scopedFieldSchemaTitle)
        : undefined;

    return (
      <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
        (
        {scopedFieldTitle
          ? t('Grouped sorting based on', { ns: NAMESPACE }) + `「${scopedFieldTitle}」`
          : t('Global sorting', { ns: NAMESPACE })}
        )
      </span>
    );
  };

  const buildCreateSchema = () => ({
    properties: {
      'uiSchema.title': {
        type: 'string',
        title: t('Field display name'),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      name: {
        type: 'string',
        title: t('Field name'),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-validator': 'uid',
        description: t(
          'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
        ),
      },
      scopeKey: {
        type: 'string',
        title: t('Grouped sorting'),
        default: groupFieldSortScopeKey,
        'x-disabled': true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: groupFieldScopeOption,
      },
    },
  });

  const buildUpdateSchema = () => ({
    properties: {
      field: {
        type: 'string',
        title: t('Convert the following integer fields to sorting fields', { ns: NAMESPACE }),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: integerFields.map((field) => ({
          value: field.name,
          label: compile(field.uiSchema?.title || field.name),
        })),
      },
      scopeKey: {
        type: 'string',
        title: t('Grouped sorting'),
        default: groupFieldSortScopeKey,
        'x-disabled': true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: groupFieldScopeOption,
      },
    },
  });

  const openSortFieldDialog = async (schema: any, initialValues: Record<string, any>) => {
    return FormDialog(
      t('Create sort field', { ns: NAMESPACE }),
      () => {
        return (
          <APIClientProvider apiClient={api}>
            <SchemaComponentOptions scope={dialogScope} components={dialogComponents}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent schema={schema} />
              </FormLayout>
            </SchemaComponentOptions>
          </APIClientProvider>
        );
      },
      theme,
    ).open({ initialValues });
  };

  const appendSortField = (fieldData: any) => {
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

    const collection = flowSettingsContext?.model?.collection as
      | { getFields?: () => Record<string, any>[]; setOption?: (key: string, value: any) => void }
      | undefined;
    if (collection?.setOption && collection?.getFields) {
      collection.setOption('fields', upsertKanbanCollectionFieldOptions(collection.getFields(), fieldData));
      (collection as any).fieldsMap = undefined;
    }
  };

  const handleCreateSortField = async () => {
    const values = await openSortFieldDialog(buildCreateSchema(), {
      name: getKanbanDefaultSortFieldName(groupField?.value),
    });

    const { data } = await api.resource('collections.fields', collectionName).create({
      values: {
        type: 'sort',
        interface: 'sort',
        ...values,
      },
    });

    appendSortField(data.data);
  };

  const handleUpdateSortField = async () => {
    const values = await openSortFieldDialog(buildUpdateSchema(), {});

    const { data } = await api.request({
      url: `dataSourcesCollections/${dataSource}.${collectionName}/fields:update?filterByTk=${values.field}`,
      method: 'post',
      data: { type: 'sort', interface: 'sort', ...values },
    });

    appendSortField(data.data);
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        options={sortFieldOptions}
        {...others}
        disabled={!groupField}
        optionRender={({ label, data }) => {
          return (
            <Space>
              <span>{label}</span>
            </Space>
          );
        }}
      />
      <Button disabled={!groupField} onClick={dataSource === 'main' ? handleCreateSortField : handleUpdateSortField}>
        {t('Add new')}
      </Button>
    </Space.Compact>
  );
};
