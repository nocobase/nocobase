import { TableOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import {
  useSchemaTemplateManager,
  useCollectionManager_deprecated,
  useGlobalTheme,
  SchemaInitializer,
  FormDialog,
  SchemaComponentOptions,
  SchemaComponent,
  useRecordCollectionDataSourceItems,
  useSchemaInitializerItem,
  useSchemaInitializer,
  SchemaInitializerItem,
} from '@nocobase/client';
import { createCalendarBlockUISchema } from '../createCalendarBlockUISchema';
import { useTranslation } from '../../../locale';

export const RecordAssociationCalendarBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { getCollection } = useCollectionManager_deprecated();
  const field = itemConfig.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;
  const { theme } = useGlobalTheme();

  return (
    <SchemaInitializerItem
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
          const values = await FormDialog(
            t('Create calendar block'),
            () => {
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
            },
            theme,
          ).open({
            initialValues: {},
          });
          insert(
            createCalendarBlockUISchema({
              association: resource,
              dataSource: item.dataSource,
              fieldNames: {
                ...values,
              },
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Calendar', itemConfig, field.target, resource)}
    />
  );
};

export function useCreateAssociationCalendarBlock() {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const createAssociationCalendarBlock = async ({ item }) => {
    const field = item.associationField;
    const collection = getCollection(field.target);

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
    const values = await FormDialog(
      t('Create calendar block'),
      () => {
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
      },
      theme,
    ).open({
      initialValues: {},
    });
    insert(
      createCalendarBlockUISchema({
        association: `${field.collectionName}.${field.name}`,
        dataSource: item.dataSource,
        fieldNames: {
          ...values,
        },
      }),
    );
  };

  return { createAssociationCalendarBlock };
}
