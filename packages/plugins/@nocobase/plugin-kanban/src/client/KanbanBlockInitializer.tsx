import { FormOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useAPIClient,
  useCollectionManager,
  useGlobalTheme,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  DataBlockInitializer,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { createKanbanBlockSchema } from './utils';

export const KanbanBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const { theme } = useGlobalTheme();
  const itemConfig = useSchemaInitializerItem();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name, item.namespace);
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
        const values = await FormDialog(
          t('Create kanban block'),
          () => {
            return (
              <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                <FormLayout layout={'vertical'}>
                  <SchemaComponent
                    schema={{
                      properties: {
                        groupField: {
                          title: t('Grouping field'),
                          enum: fields,
                          required: true,
                          description: '{{t("Single select and radio fields can be used as the grouping field")}}',
                          'x-component': 'Select',
                          'x-component-props': {
                            objectValue: true,
                            fieldNames: { label: 'label', value: 'value' },
                          },
                          'x-decorator': 'FormItem',
                        },
                      },
                    }}
                  />
                </FormLayout>
              </SchemaComponentOptions>
            );
          },
          theme,
        ).open({
          initialValues: {},
        });
        const sortName = `${values.groupField.value}_sort`;
        const exists = collectionFields?.find((field) => field.name === sortName);
        if (!exists) {
          await api.resource('collections.fields', item.name).create({
            values: {
              type: 'sort',
              name: sortName,
              hidden: true,
              scopeKey: values.groupField.value,
            },
          });
        }
        insert(
          createKanbanBlockSchema({
            groupField: values.groupField.value,
            collection: item.name,
            namespace: item.namespace,
            params: {
              sort: [sortName],
              paginate: false,
            },
          }),
        );
      }}
    />
  );
};
