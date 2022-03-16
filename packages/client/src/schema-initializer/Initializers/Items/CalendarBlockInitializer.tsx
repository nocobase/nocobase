import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { ISchema, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../../schema-component';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCollectionDataSourceItems } from '../utils';

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
    'x-designer': 'Calendar.Designer',
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
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: '{{ t("View record") }}',
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '详情',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
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
        const values = await FormDialog('创建日历区块', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: '标题字段',
                        enum: stringFields,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: '开始日期字段',
                        enum: dateFields,
                        required: true,
                        default: 'createdAt',
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: '结束日期字段',
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
        insert(createSchema(item.name, values));
      }}
      items={useCollectionDataSourceItems('Calendar')}
    />
  );
};
