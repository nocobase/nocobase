import { ISchema, useForm } from '@formily/react';
import { useEffect } from 'react';
import { useActionContext, useAPIClient, useRecord, useRequest } from '../../../';

const collection = {
  name: 'collections',
  targetKey: 'name',
  filterTargetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '数据表名称',
        type: 'number',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '数据表标识',
        type: 'string',
        'x-component': 'Input',
        description: '使用英文',
      } as ISchema,
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
  ],
};

export const roleCollectionsSchema: ISchema = {
  type: 'void',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    association: {
      sourceKey: 'name',
      targetKey: 'name',
    },
    resourceName: 'roles.collections',
    request: {
      resource: 'roles.collections',
      action: 'list',
      params: {
        pageSize: 5,
        filter: {},
        sort: ['sort'],
        appends: [],
      },
    },
  },
  properties: {
    table1: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'name',
        // rowSelection: {
        //   type: 'checkbox',
        // },
        useDataSource: '{{ useDataSourceFromRAC }}',
      },
      properties: {
        column1: {
          type: 'void',
          'x-decorator': 'TableColumnDecorator',
          'x-component': 'VoidTable.Column',
          properties: {
            title: {
              type: 'number',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column2: {
          type: 'void',
          'x-decorator': 'TableColumnDecorator',
          'x-component': 'VoidTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          title: 'Actions',
          'x-component': 'VoidTable.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                configure: {
                  type: 'void',
                  title: '单独配置权限',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useValues(options) {
                          const record = useRecord();
                          const { visible } = useActionContext();
                          const result = useRequest(
                            {
                              resource: 'roles.resources',
                              resourceOf: record.roleName,
                              action: 'get',
                              params: {
                                filterByTk: record.name,
                              },
                            },
                            { ...options, manual: true },
                          );
                          useEffect(() => {
                            if (record.usingConfig === 'strategy') {
                              return;
                            }
                            if (visible) {
                              result.run();
                            }
                          }, [visible, record.usingConfig]);
                          return;
                        },
                      },
                      title: '配置权限',
                      properties: {
                        usingActionsConfig: {
                          'x-component': 'Radio.Group',
                          'x-decorator': 'FormItem',
                          default: false,
                          enum: [
                            { value: false, label: '使用通用权限：只能查看、添加、修改数据' },
                            { value: true, label: '单独配置权限' },
                          ],
                        },
                        actions: {
                          'x-component': 'RolesResourcesActions',
                          'x-decorator': 'FormItem',
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            action1: {
                              title: 'Cancel',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ useCancelAction }}',
                              },
                            },
                            action2: {
                              title: 'Submit',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                useAction: () => {
                                  const form = useForm();
                                  const api = useAPIClient();
                                  const record = useRecord();
                                  return {
                                    async run() {
                                      await api.resource('roles.resources', record.roleName).create({
                                        values: {
                                          ...form.values,
                                          name: record.name,
                                        },
                                      });
                                    },
                                  };
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
        },
      },
    },
  },
};
