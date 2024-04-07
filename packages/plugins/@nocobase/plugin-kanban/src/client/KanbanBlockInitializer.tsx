import { FormOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext, useForm } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  APIClientProvider,
  useCollectionManager_deprecated,
  useGlobalTheme,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  DataBlockInitializer,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useAPIClient,
} from '@nocobase/client';
import { createKanbanBlockUISchema } from './createKanbanBlockUISchema';
import { CreateAndSelectSort } from './CreateAndSelectSort';
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
                        collectionName: item.name,
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

export const KanbanBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const { theme } = useGlobalTheme();
  const itemConfig = useSchemaInitializerItem();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const { data } = await api.resource('collections.fields', item.name).list({ paginate: false });
        const targetFields = getCollectionFields(item.name, item.dataSource);
        const collectionFields = item.dataSource === 'main' ? data.data : targetFields;
        const fields = collectionFields
          ?.filter((field) => ['select', 'radioGroup'].includes(field.interface))
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
      }}
    />
  );
};
