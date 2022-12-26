import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useAPIClient } from '../../api-client';
import { useCollectionManager } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { DataBlockInitializer } from './DataBlockInitializer';

export const ChartBlockInitializer = (props) => {
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
        const values = await FormDialog(t('Create chart block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      chartType: {
                        title: t('Chart type'),
                        required: true,
                        'x-component': 'Select',
                        'x-component-props': {
                          objectValue: true,
                          fieldNames: { label: 'label', value: 'value' },
                        },
                        'x-decorator': 'FormItem',
                        enum: [{ label: 'Statistic', value: 'statistic' }],
                      },
                      tabs1: {
                        type: 'void',
                        'x-component': 'Tabs',
                        'x-component-props': {
                          style: {
                            marginTop: -15,
                          },
                        },
                        properties: {
                          dataset: {
                            type: 'object',
                            title: 'Dataset options',
                            'x-component': 'Tabs.TabPane',
                            'x-component-props': {
                              tab: 'Dataset options',
                            },
                            properties: {
                              type: {
                                title: t('Type'),
                                required: true,
                                'x-component': 'Select',
                                'x-decorator': 'FormItem',
                                default: 'builtIn',
                                enum: [
                                  { label: 'Built-in', value: 'builtIn' },
                                  { label: 'SQL', value: 'sql' },
                                  { label: 'API', value: 'api' },
                                ],
                              },
                              sql: {
                                title: t('SQL'),
                                'x-component': 'Input.TextArea',
                                'x-decorator': 'FormItem',
                                'x-reactions': {
                                  dependencies: ['dataset.type'],
                                  fulfill: {
                                    state: {
                                      visible: '{{$deps[0] === "sql"}}',
                                    },
                                  },
                                },
                              },
                              api: {
                                title: t('API'),
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                'x-reactions': {
                                  dependencies: ['dataset.type'],
                                  fulfill: {
                                    state: {
                                      visible: '{{$deps[0] === "api"}}',
                                    },
                                  },
                                },
                              },
                              aggregateFunction: {
                                title: t('Aggregate function'),
                                required: true,
                                'x-component': 'Radio.Group',
                                'x-decorator': 'FormItem',
                                enum: [
                                  { label: 'SUM', value: 'SUM' },
                                  { label: 'COUNT', value: 'COUNT' },
                                  { label: 'AVG', value: 'AVG' },
                                ],
                                'x-reactions': {
                                  dependencies: ['dataset.type'],
                                  fulfill: {
                                    state: {
                                      visible: '{{$deps[0] === "builtIn"}}',
                                    },
                                  },
                                },
                              },
                              computedField: {
                                title: t('Computed field'),
                                required: true,
                                'x-component': 'Select',
                                'x-component-props': {
                                  objectValue: true,
                                  fieldNames: { label: 'label', value: 'value' },
                                },
                                'x-decorator': 'FormItem',
                                enum: [{ label: 'Statistic', value: 'statistic' }],
                                'x-reactions': {
                                  dependencies: ['dataset.type'],
                                  fulfill: {
                                    state: {
                                      visible: '{{$deps[0] === "builtIn"}}',
                                    },
                                  },
                                },
                              },
                              filter: {
                                title: t('Filter'),
                                'x-component': 'Filter',
                                'x-decorator': 'FormItem',
                                'x-reactions': {
                                  dependencies: ['dataset.type'],
                                  fulfill: {
                                    state: {
                                      visible: '{{$deps[0] === "builtIn"}}',
                                    },
                                  },
                                },
                              },
                            },
                          },
                          chart: {
                            type: 'object',
                            title: 'Chart options',
                            'x-component': 'Tabs.TabPane',
                            'x-component-props': {
                              tab: 'Chart options',
                            },
                            properties: {
                              title: {
                                title: t('Title'),
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                              },
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
      }}
    />
  );
};
