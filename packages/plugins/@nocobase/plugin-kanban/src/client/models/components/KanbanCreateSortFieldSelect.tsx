/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { observer, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  Select,
  useAPIClient,
  useCompile,
  useGlobalTheme,
  useSchemaComponentContext,
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

export const KanbanCreateSortFieldSelect = observer(
  (props: {
    sortFields?: SortFieldOption[];
    collectionFields?: CollectionFieldMetadata[];
    groupField?: GroupFieldOption;
    collectionName?: string;
    dataSource?: string;
    useGroupingFormValues?: boolean;
    [key: string]: any;
  }) => {
    const {
      sortFields: sortFieldsProp = [],
      collectionFields: collectionFieldsProp = [],
      groupField: groupFieldProp,
      collectionName: collectionNameProp,
      dataSource: dataSourceProp,
      useGroupingFormValues,
      ...others
    } = props;
    const formField: any = useField();
    const form = useForm();
    const compile = useCompile();
    const api = useAPIClient();
    const { t } = useTranslation();
    const { theme } = useGlobalTheme();
    const schemaComponentContext = useSchemaComponentContext();
    const schemaOptions = useContext(SchemaOptionsContext);
    const flowSettingsContext = useFlowSettingsContext<any>();
    const model = flowSettingsContext?.model;
    const collection = model?.collection || flowSettingsContext?.collection;
    const flowSettings = flowSettingsContext?.model?.context?.engine?.flowSettings;
    const grouping = useGroupingFormValues ? form?.values?.grouping || {} : {};
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
        label: compile(field?.uiSchema?.title || field?.name || groupFieldName),
        value: groupFieldName,
      };
    }, [collectionFields, compile, groupFieldName, groupFieldProp, useGroupingFormValues]);
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
    const handleSortFieldChange = (value: string | null) => {
      formField.onInput?.(value);
      if (useGroupingFormValues) {
        form?.setValuesIn?.('grouping.dragSortBy', value);
      }
    };
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
      if (!formField.value) {
        return;
      }

      const selectedFieldExists = sortFieldOptions.some((item) => item.value === formField.value);
      if (!selectedFieldExists) {
        formField.value = null;
      }
    }, [formField, sortFieldOptions]);

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

    const reloadCollectionMetadata = async () => {
      const resolvedDataSource = dataSource || 'main';
      await flowSettingsContext?.model?.context?.dataSourceManager?.reloadDataSource?.(resolvedDataSource);
      schemaComponentContext?.refresh?.();
    };

    const appendSortField = (fieldData: any) => {
      const nextOption = {
        ...fieldData,
        value: fieldData.name,
        label: compile(fieldData?.uiSchema?.title || fieldData.name),
      };
      setCreatedSortFields(
        (previousFields) =>
          upsertKanbanCollectionFieldOptions(previousFields as Record<string, any>[], nextOption) as SortFieldOption[],
      );
      formField.dataSource = upsertKanbanCollectionFieldOptions(
        (formField.dataSource || sortFields) as Record<string, any>[],
        nextOption,
      );
      handleSortFieldChange(fieldData.name);

      upsertKanbanFlowCollectionField(flowSettingsContext?.model?.collection, fieldData);
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
      await reloadCollectionMetadata();
    };

    const handleUpdateSortField = async () => {
      const values = await openSortFieldDialog(buildUpdateSchema(), {});

      const { data } = await api.request({
        url: `dataSourcesCollections/${dataSource}.${collectionName}/fields:update?filterByTk=${values.field}`,
        method: 'post',
        data: { type: 'sort', interface: 'sort', ...values },
      });

      appendSortField(data.data);
      await reloadCollectionMetadata();
    };

    return (
      <Space.Compact style={{ width: '100%' }}>
        <Select
          options={sortFieldOptions}
          {...others}
          value={formField.value}
          onChange={handleSortFieldChange}
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
  },
);
