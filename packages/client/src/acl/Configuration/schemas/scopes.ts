import { ISchema, useForm } from '@formily/react';
import { useActionContext } from '../../../';
import { useAPIClient, useRequest } from '../../../api-client';
import { useRecord } from '../../../record-provider';

const collection = {
  name: 'rolesResourcesScopes',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '名称',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
  ],
};

export const scopesSchema: ISchema = {
  type: 'object',
  properties: {
    scope: {
      'x-component': 'RecordPicker',
      'x-component-props': {
        size: 'small',
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        onChange: '{{ onChange }}',
      },
      properties: {
        options: {
          'x-decorator': 'RolesResourcesScopesSelectedRowKeysProvider',
          'x-component': 'RecordPicker.Options',
          type: 'void',
          title: '可操作的数据范围',
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
                // delete: {
                //   type: 'void',
                //   title: '删除',
                //   'x-component': 'Action',
                // },
                create: {
                  type: 'void',
                  title: '添加数据范围',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      'x-decorator': 'Form',
                      title: '添加数据范围',
                      properties: {
                        name: {
                          title: '数据范围名称',
                          'x-component': 'Input',
                          'x-decorator': 'FormItem',
                        },
                        // scope: {
                        //   'x-component': 'Input',
                        //   'x-decorator': 'FormItem',
                        // },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            action1: {
                              title: 'Cancel',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            action2: {
                              title: 'Submit',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                useAction() {
                                  const api = useAPIClient();
                                  const ctx = useActionContext();
                                  const form = useForm();
                                  const record = useRecord();
                                  return {
                                    async run() {
                                      await api.resource('rolesResourcesScopes').create({
                                        values: {
                                          ...form.values,
                                          resourceName: record.name,
                                        },
                                      });
                                      ctx.setVisible(false);
                                      api.service('rolesResourcesScopesList')?.refresh?.();
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
            input: {
              type: 'array',
              'x-component': 'Table.RowSelection',
              'x-component-props': {
                rowKey: 'id',
                objectValue: true,
                rowSelection: {
                  type: 'radio',
                },
                // useSelectedRowKeys() {
                //   const [selectedRowKeys, setSelectedRowKeys] = useRolesResourcesScopesSelectedRowKeys();
                //   return [selectedRowKeys, setSelectedRowKeys];
                // },
                useDataSource(options) {
                  const record = useRecord();
                  return useRequest(
                    {
                      resource: 'rolesResourcesScopes',
                      action: 'list',
                      params: {
                        sort: 'id',
                        filter: JSON.stringify({
                          $or: [
                            {
                              'resourceName.$eq': record.name,
                            },
                            {
                              'resourceName.$eq': '*',
                            },
                          ],
                        }),
                      },
                    },
                    {
                      ...options,
                      uid: 'rolesResourcesScopesList',
                    },
                  );
                },
                // dataSource: [
                //   { id: 1, name: 'Name1' },
                //   { id: 2, name: 'Name2' },
                //   { id: 3, name: 'Name3' },
                // ],
              },
              properties: {
                column1: {
                  type: 'void',
                  title: 'Name',
                  'x-component': 'Table.Column',
                  properties: {
                    name: {
                      type: 'string',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                  },
                },
                column2: {
                  type: 'void',
                  title: 'Actions',
                  'x-component': 'Table.Column',
                  // properties: {
                  //   delete: {
                  //     type: 'void',
                  //     title: '删除',
                  //     'x-component': 'Action.Link',
                  //   },
                  // },
                },
              },
            },
          },
        },
      },
    },
  },
};
