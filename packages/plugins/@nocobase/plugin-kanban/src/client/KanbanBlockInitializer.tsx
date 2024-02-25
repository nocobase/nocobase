import { FormOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useCollectionManager_deprecated,
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
  const { getCollectionFields } = useCollectionManager_deprecated();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const itemConfig = useSchemaInitializerItem();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name, item.dataSource);
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
          ?.filter((field) => ['sort'].includes(field.interface) && field.scopeKey)
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
                          description: t('Single select and radio fields can be used as the grouping field'),
                          'x-component': 'Select',
                          'x-component-props': {
                            objectValue: true,
                            fieldNames: { label: 'label', value: 'value' },
                          },
                          'x-decorator': 'FormItem',
                        },
                        dragSortBy: {
                          title: t('Sorting field'),
                          required: true,
                          description: t('Drag-and-drop sorting of Kanban cards'),
                          'x-component': 'Select',
                          'x-component-props': {
                            objectValue: true,
                            fieldNames: { label: 'label', value: 'value' },
                          },
                          'x-decorator': 'FormItem',
                          'x-reactions': (field) => {
                            field.dataSource = sortFields.filter(
                              (v) => v.scopeKey === field.form.values?.groupField?.value,
                            );
                          },
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
        const sortName = values.dragSortBy;

        insert(
          createKanbanBlockSchema({
            sortField: values.dragSortBy,
            groupField: values.groupField.value,
            collection: item.name,
            dataSource: item.dataSource,
            params: {
              sort: [sortName.value],
              paginate: false,
            },
          }),
        );
      }}
    />
  );
};
