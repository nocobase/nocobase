import React, { useContext } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { FormOutlined } from '@ant-design/icons';
import { SchemaOptionsContext } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useCollectionManager } from '../../collection-manager';
import { createKanbanV2BlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { KanbanOptions } from '../components/KanbanOptions';

export const KanbanV2BlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionFields, getCollectionFieldsOptions } = useCollectionManager();
  const options: any = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const getAssociateResource = (collectionName) => {
    return api.resource(collectionName);
  };
  return (
    <DataBlockInitializer
      {...props}
      componentType={'KanbanV2'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name);
        const groupFieldsOptions = getCollectionFieldsOptions(item.name, 'string', {
          association: ['linkTo', 'm2m', 'm2o', 'o2m', 'o2o', 'oho'],
        }).filter((v) => v.children || ['select', 'radioGroup'].includes(v.interface));
        const values = await FormDialog(t('Create kanban block'), () => {
          return (
            <SchemaComponentOptions
              scope={{ ...options.scope, collectionFields, getAssociateResource }}
              components={{ ...options.components, KanbanOptions }}
            >
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      groupField: {
                        title: t('Grouping field'),
                        enum: groupFieldsOptions,
                        required: true,
                        description: '{{t("Single select and radio fields can be used as the grouping field")}}',
                        'x-component': 'Cascader',
                        'x-component-props': {
                          objectValue: true,
                          fieldNames: { label: 'label', value: 'value' },
                        },
                        'x-decorator': 'FormItem',
                      },
                      options: {
                        type: 'void',
                        'x-decorator': 'FormItem',
                        'x-component': 'KanbanOptions',
                        'x-component-props': {
                          name: item.name,
                        },
                        'x-reactions': {
                          dependencies: ['groupField'],
                          fulfill: {
                            schema: {
                              'x-component-props': '{{{getAssociateResource,collectionFields,...$form.values}}}',
                            },
                          },
                        },
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
        console.log(values.groupField)
        const groupField =
          values.groupField.length > 1 ? `${values.groupField?.[0]}.${values.groupField?.[1]}` : values.groupField?.[0];
        const sortName = `${groupField}_sort`;
        const exists = collectionFields?.find((field) => field.name === sortName);
        if (!exists) {
          await api.resource('collections.fields', item.name).create({
            values: {
              type: 'sort',
              name: sortName,
              hidden: true,
              scopeKey: groupField,
            },
          });
        }
        insert(
          createKanbanV2BlockSchema({
            groupField: values.groupField,
            collection: item.name,
            columns: values.options,
            params: {
              sort: [sortName],
            },
          }),
        );
      }}
    />
  );
};
