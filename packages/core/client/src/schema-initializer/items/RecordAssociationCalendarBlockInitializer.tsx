import React, { useContext } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import { createCalendarBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';

export const RecordAssociationCalendarBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;

  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          const stringFields = collection?.fields
            ?.filter((field) => field.type === 'string')
            ?.map((field) => {
              return {
                label: field?.uiSchema?.title,
                value: field.name,
              };
            });
          const dateFields = collection?.fields
            ?.filter((field) => field.type === 'date')
            ?.map((field) => {
              return {
                label: field?.uiSchema?.title,
                value: field.name,
              };
            });
          const values = await FormDialog(t('Create calendar block'), () => {
            return (
              <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                <FormLayout layout={'vertical'}>
                  <SchemaComponent
                    schema={{
                      properties: {
                        title: {
                          title: t('Title field'),
                          enum: stringFields,
                          required: true,
                          'x-component': 'Select',
                          'x-decorator': 'FormItem',
                        },
                        start: {
                          title: t('Start date field'),
                          enum: dateFields,
                          required: true,
                          default: 'createdAt',
                          'x-component': 'Select',
                          'x-decorator': 'FormItem',
                        },
                        end: {
                          title: t('End date field'),
                          enum: dateFields,
                          'x-component': 'Select',
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
          insert(
            createCalendarBlockSchema({
              collection: field.target,
              resource,
              association: resource,
              fieldNames: {
                ...values,
              },
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Calendar', item, field.target, resource)}
    />
  );
};
