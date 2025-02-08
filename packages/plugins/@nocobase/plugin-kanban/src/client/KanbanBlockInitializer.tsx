/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ProjectOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext, useForm } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  APIClientProvider,
  Collection,
  CollectionFieldOptions,
  DataBlockInitializer,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useApp,
  useCollectionManager_deprecated,
  useGlobalTheme,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { CreateAndSelectSort } from './CreateAndSelectSort';
import { createKanbanBlockUISchema } from './createKanbanBlockUISchema';
import { NAMESPACE } from './locale';

const CreateKanbanForm = ({ item, sortFields, collectionFields, fields, options, api }) => {
  const form = useForm();
  const { t } = useTranslation();

  return (
    <APIClientProvider apiClient={api}>
      <SchemaComponentOptions
        scope={{
          ...options?.scope,
        }}
        components={{ ...options?.components }}
      >
        <FormLayout layout={'vertical'}>
          <SchemaComponent
            schema={{
              properties: {
                groupField: {
                  title: t('Grouping field'),
                  enum: fields,
                  required: true,
                  description: t('Single select and radio fields can be used as the grouping field'),
                  'x-component': 'Select',
                  'x-component-props': {
                    objectValue: true,
                    fieldNames: { label: 'label', value: 'value' },
                    onChange: () => {
                      form.setValuesIn('dragSortBy', null);
                    },
                  },
                  'x-decorator': 'FormItem',
                },
                dragSortBy: {
                  title: t('Sorting field', { ns: NAMESPACE }),
                  required: true,
                  description: t(
                    'Used for sorting kanban cards, only sorting fields corresponding to grouping fields can be selected',
                    { ns: NAMESPACE },
                  ),
                  'x-component': CreateAndSelectSort,
                  'x-component-props': {
                    objectValue: true,
                    fieldNames: { label: 'label', value: 'value' },
                    sortFields,
                  },
                  'x-decorator': 'FormItem',
                  'x-reactions': [
                    (field) => {
                      field.dataSource = sortFields.map((v) => {
                        return {
                          ...v,
                          disabled: v.scopeKey !== field.form.values?.groupField?.value,
                        };
                      });
                      field.groupField = field.form.values?.groupField;
                      field.setComponentProps({
                        dataSource: item.dataSource,
                        collectionName: item.collectionName || item.name,
                        collectionFields,
                        sortFields: sortFields,
                      });
                    },
                    {
                      dependencies: ['.groupField'],
                      fulfill: {
                        schema: {
                          'x-component-props': '{{$form.values}}',
                        },
                      },
                    },
                  ],
                },
              },
            }}
          />
        </FormLayout>
      </SchemaComponentOptions>
    </APIClientProvider>
  );
};

export const KanbanBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  showAssociationFields,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  createBlockSchema?: (options: any) => any;
  showAssociationFields?: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();
  const { createKanbanBlock } = useCreateKanbanBlock();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={`Kanban`}
      icon={<ProjectOutlined />}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }
        createKanbanBlock(options);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};

export const useCreateKanbanBlock = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const api = useAPIClient();
  const app = useApp();
  const plugin = app.pm.get('kanban') as any;
  const groupFieldInterfaces = plugin.getGroupFieldInterface() || [];
  const createKanbanBlock = async ({ item }) => {
    const collectionFields = getCollectionFields(item.name, item.dataSource);
    const fields = collectionFields
      ?.filter((field) => Object.keys(groupFieldInterfaces).find((v) => v === field.interface))
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
          uiSchema: {
            ...field.uiSchema,
            name: field.name,
          },
        };
      });
    const sortFields = collectionFields
      ?.filter((field) => ['sort'].includes(field.interface))
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
          scopeKey: field.scopeKey,
          uiSchema: {
            ...field.uiSchema,
            name: field.name,
          },
        };
      });

    const values = await FormDialog(
      t('Create kanban block'),
      <CreateKanbanForm
        item={item}
        sortFields={sortFields}
        collectionFields={collectionFields}
        fields={fields}
        options={options}
        api={api}
      />,
      theme,
    ).open({
      initialValues: {},
    });
    insert(
      createKanbanBlockUISchema({
        sortField: values.dragSortBy,
        groupField: values.groupField.value,
        collectionName: item.name,
        dataSource: item.dataSource,
        params: {
          sort: [values.dragSortBy],
        },
      }),
    );
  };

  return { createKanbanBlock };
};

export function useCreateAssociationKanbanBlock() {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const api = useAPIClient();
  const app = useApp();

  const createAssociationKanbanBlock = async ({ item }) => {
    const field = item.associationField;
    const collectionFields = getCollectionFields(item.name, item.dataSource);
    const plugin = app.pm.get('kanban') as any;
    const groupFieldInterfaces = plugin.getGroupFieldInterface() || [];

    const fields = collectionFields
      ?.filter((field) => Object.keys(groupFieldInterfaces).find((v) => v === field.interface))
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
          uiSchema: {
            ...field.uiSchema,
            name: field.name,
          },
        };
      });
    const sortFields = collectionFields
      ?.filter((field) => ['sort'].includes(field.interface))
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
          scopeKey: field.scopeKey,
          uiSchema: {
            ...field.uiSchema,
            name: field.name,
          },
        };
      });
    const values = await FormDialog(
      t('Create kanban block'),
      <CreateKanbanForm
        item={item}
        sortFields={sortFields}
        collectionFields={collectionFields}
        fields={fields}
        options={options}
        api={api}
      />,
      theme,
    ).open({
      initialValues: {},
    });
    insert(
      createKanbanBlockUISchema({
        sortField: values.dragSortBy,
        groupField: values.groupField.value,
        association: `${field.collectionName}.${field.name}`,
        dataSource: item.dataSource,
        params: {
          sort: [values.dragSortBy],
        },
      }),
    );
  };

  return { createAssociationKanbanBlock };
}
