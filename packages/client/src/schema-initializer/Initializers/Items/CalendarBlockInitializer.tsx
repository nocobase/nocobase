import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { ISchema, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../../schema-component';
import { SchemaInitializer } from '../../SchemaInitializer';

const createSchema = (collectionName, { title, start, end }) => {
  const schema: ISchema = {
    type: 'void',
    'x-collection': 'collections',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: collectionName,
      request: {
        resource: collectionName,
        action: 'list',
        params: {},
      },
    },
    'x-designer': 'Form.Designer',
    'x-component': 'CardItem',
    properties: {
      calendar: {
        type: 'void',
        'x-component': 'Calendar',
        'x-component-props': {
          useDataSource: '{{ cm.useDataSourceFromRAC }}',
          fieldNames: {
            title,
            start,
            end,
          },
        },
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'Calendar.ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'CalendarActionInitializers',
            properties: {},
          },
          event: {
            type: 'void',
            name: 'event',
            'x-component': 'Calendar.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  useValues: '{{ cm.useValuesFromRecord }}',
                },
                'x-component': 'Action.Drawer',
                title: '{{ t("Edit record") }}',
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'GridFormItemInitializers',
                    properties: {},
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      actions: {
                        type: 'void',
                        'x-initializer': 'PopupFormActionInitializers',
                        'x-decorator': 'DndContext',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          layout: 'one-column',
                        },
                        properties: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return schema;
};

export const CalendarBlockInitializer = (props) => {
  const { insert } = props;
  const { collections, getCollection } = useCollectionManager();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={async ({ item }) => {
        const collection = getCollection(item.name);
        const fieldEnum = collection?.fields?.map((field) => {
          return {
            label: field?.uiSchema?.title,
            value: field.name,
          };
        });
        const values = await FormDialog('创建日历区块', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: '标题字段',
                        enum: fieldEnum,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: '开始日期字段',
                        enum: fieldEnum,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: '结束日期字段',
                        enum: fieldEnum,
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
        insert(createSchema(item.name, values));
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Select data source'),
          children: collections?.map((item) => {
            return {
              type: 'item',
              name: item.name,
              title: item.title,
            };
          }),
        },
      ]}
    />
  );
};
