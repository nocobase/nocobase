import React, { useContext } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { FormOutlined } from '@ant-design/icons';
import { SchemaOptionsContext } from '@formily/react';
import { useTranslation } from 'react-i18next';

import { useAPIClient } from '../../api-client';
import { useCollectionManager } from '../../collection-manager';
import { createKanbanBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';

export const KanbanBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionFields, getCollection } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name);
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
        const values = await FormDialog(t('Create kanban block'), () => {
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
        }).open({
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
