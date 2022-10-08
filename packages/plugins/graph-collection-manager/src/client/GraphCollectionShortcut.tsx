import { PartitionOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { useActionContext, useRequest,PluginManager, SchemaComponent} from '@nocobase/client';
import { DeleteOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Editor } from './GraphDrawPage';
import {collection} from './schemas/collection'
import {GraphDrawerProver} from './GraphCollectionEditorProvder'


const useCollectionValues = (options) => {
  const { visible } = useActionContext();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          name: `t_${uid()}`,
          createdBy: true,
          updatedBy: true,
          sortable: true,
          logging: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
            {
              interface: 'createdAt',
              type: 'date',
              field: 'createdAt',
              name: 'createdAt',
              uiSchema: {
                type: 'datetime',
                title: '{{t("Created at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              interface: 'createdBy',
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'createdById',
              name: 'createdBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Created by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
            {
              type: 'date',
              field: 'updatedAt',
              name: 'updatedAt',
              interface: 'updatedAt',
              uiSchema: {
                type: 'string',
                title: '{{t("Last updated at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'updatedById',
              name: 'updatedBy',
              interface: 'updatedBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Last updated by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
          ],
        },
      }),
    {
      ...options,
      manual: true,
    },
  );

  useEffect(() => {
    if (visible) {
      result.run();
    }
  }, [visible]);

  return result;
};


export const GraphCollectionPane = () => {
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            block1: {
              type: 'void',
              'x-collection': 'collections',
              'x-decorator': 'ResourceActionProvider',
              'x-decorator-props': {
                collection,
                request: {
                  resource: 'collections',
                  action: 'list',
                  params: {
                    pageSize: 50,
                    filter: {
                      inherit: false,
                    },
                    sort: ['sort'],
                    appends: [],
                  },
                },
              },
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  'x-component-props': {
                    style: {
                      marginBottom: 16,
                    },
                  },
                  properties: {
                    create: {
                      type: 'void',
                      title: '{{ t("Create collection") }}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Create collection") }}',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'Form',
                          'x-decorator-props': {
                            useValues: '{{ useCollectionValues }}',
                          },
                          properties: {
                            title: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            name: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-validator': 'uid',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                action1: {
                                  title: '{{ t("Cancel") }}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    useAction: '{{ cm.useCancelAction }}',
                                  },
                                },
                                action2: {
                                  title: '{{ t("Submit") }}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                    useAction: '{{ cm.useCreateActionAndRefreshCM }}',
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
            editor: {
              type: 'void',
              'x-decorator': 'GraphDrawerProver',
              'x-component': 'Editor',
            },
          },
        }}
        components={{
          Editor,
          GraphDrawerProver,
          DeleteOutlined
        }}
        scope={{useCollectionValues}}
      />
    </Card>
  );
};

export const GraphCollectionShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<PartitionOutlined />}
      title={t('graph collection')}
      onClick={() => {
        history.push('/admin/settings/graph/collections');
      }}
    />
  );
};
