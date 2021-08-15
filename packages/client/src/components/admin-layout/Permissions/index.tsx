import { SchemaRenderer } from '../../../';
import React, { useContext, useEffect } from 'react';
import { FormItem } from '@formily/antd';
import { action } from '@formily/reactive';
import { useCollectionsContext } from '../../../constate/Collections';
import { Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { uid, isValid } from '@formily/shared';
import { Resource } from '../../../resource';
import { TableRowContext, useTable } from '../../../schemas/table';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../../context';
import { connect, observer, useForm } from '@formily/react';
import { DescriptionsContext } from '../../../schemas/form';
import { createContext } from 'react';
import { ActionPermissionField } from './ActionPermissionField';
import { MenuPermissionTable } from './MenuPermissionTable';
import { ISchema } from '../../../';

export const RoleContext = createContext(null);

function RoleProvider(props) {
  const ctx = useContext(TableRowContext);
  return (
    <RoleContext.Provider value={ctx.record}>
      {props.children}
    </RoleContext.Provider>
  );
}

const useResource = () => {
  const resource = Resource.make('roles');
  return {
    resource,
  };
};

const useCollectionsResource = () => {
  const descriptionsContext = useContext(DescriptionsContext);
  console.log('descriptionsContext.service', descriptionsContext.service);
  const resource = Resource.make('collections');
  return {
    resource,
  };
};

class ActionPermissionResource extends Resource {
  save(options?: any) {
    console.log('ActionPermissionResource.save');
    return Promise.resolve({});
  }
}

const useActionPermissionSubmit = () => {
  const form = useForm();
  const role = useContext(RoleContext);
  const resource = Resource.make({
    resourceName: 'roles',
    resourceKey: role.name,
  });
  return {
    async run() {
      await resource.save(form.values);
      console.log('useActionPermissionSubmit', form.values?.actionPermissions);
    },
  };
};

const useActionPermissionResource = ({ onSuccess }) => {
  const role = useContext(RoleContext);
  console.log('RoleContext', role);
  // const { props } = useTable();
  const ctx = useContext(TableRowContext);
  const resource = ActionPermissionResource.make({
    resourceName: 'action_permissions',
  });
  const service = useRequest(
    (params?: any) => {
      return resource.list({
        ...params,
        filter: {
          role_name: role.name,
          collection_name: ctx.record.name,
        },
        appends: ['fields'],
      });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess(data) {
        console.log('actionPermissions', data);
        onSuccess({
          actionPermissions: data.map((permission) => {
            const item: any = {}
            Object.keys(permission).forEach(key => {
              if (isValid(permission[key])) {
                item[key] = permission[key];
              }
            });
            item.fields =
              permission?.fields.map((field) => field.key) || [];
            return item;
          }),
        });
      },
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const useDetailsResource = ({ onSuccess }) => {
  const { props } = useTable();
  const ctx = useContext(TableRowContext);
  const resource = Resource.make({
    resourceName: 'roles',
    resourceKey: ctx.record[props.rowKey],
  });
  const service = useRequest(
    (params?: any) => {
      return resource.get({ ...params });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const collectionSchema: ISchema = {
  type: 'array',
  // 'x-decorator': 'CardItem',
  'x-component': 'Table',
  default: [],
  'x-component-props': {
    rowKey: 'name',
    showIndex: true,
    refreshRequestOnChange: true,
    pagination: {
      pageSize: 10,
    },
    useResource: useCollectionsResource,
    collectionName: 'collections',
  },
  properties: {
    [uid()]: {
      type: 'void',
      title: '操作',
      'x-component': 'Table.Operation',
      'x-component-props': {
        className: 'nb-table-operation',
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'EllipsisOutlined',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Action.Dropdown',
              'x-component-props': {},
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '配置',
                  'x-component': 'Menu.Action',
                  'x-component-props': {
                    style: {
                      minWidth: 150,
                    },
                  },
                  'x-action-type': 'view',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: '数据表操作权限',
                      'x-component': 'Action.Drawer',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useResource: useActionPermissionResource,
                      },
                      'x-component-props': {
                        useOkAction: useActionPermissionSubmit,
                      },
                      properties: {
                        actionPermissions: {
                          type: 'array',
                          'x-component': 'ActionPermissionField',
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
    column1: {
      type: 'void',
      title: '数据表名称',
      'x-component': 'Table.Column',
      properties: {
        title: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
    column2: {
      type: 'void',
      title: '数据表标识',
      'x-component': 'Table.Column',
      properties: {
        name: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
  },
};

const menuSchema: ISchema = {
  type: 'array',
  'x-component': 'MenuPermissionTable',
};

const schema: ISchema = {
  type: 'void',
  name: 'action',
  'x-component': 'Action',
  'x-component-props': {
    className: 'nb-database-config',
    icon: 'LockOutlined',
    type: 'primary',
  },
  properties: {
    modal1: {
      type: 'void',
      title: '权限组',
      'x-component': 'Action.Drawer',
      properties: {
        table: {
          type: 'array',
          // 'x-decorator': 'CardItem',
          'x-component': 'Table',
          default: [],
          'x-component-props': {
            rowKey: 'name',
            dragSort: true,
            showIndex: true,
            refreshRequestOnChange: true,
            pagination: {
              pageSize: 10,
            },
            useResource,
            collectionName: 'roles',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Table.ActionBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  name: 'action1',
                  title: '删除',
                  'x-align': 'right',
                  'x-decorator': 'AddNew.Displayed',
                  'x-decorator-props': {
                    displayName: 'destroy',
                  },
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ Table.useTableDestroyAction }}',
                  },
                },
                [uid()]: {
                  type: 'void',
                  name: 'action1',
                  title: '新增',
                  'x-align': 'right',
                  'x-decorator': 'AddNew.Displayed',
                  'x-decorator-props': {
                    displayName: 'create',
                  },
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: '新增数据',
                      'x-decorator': 'Form',
                      'x-component': 'Action.Drawer',
                      'x-component-props': {
                        useOkAction: '{{ Table.useTableCreateAction }}',
                      },
                      properties: {
                        title: {
                          type: 'string',
                          title: '权限名称',
                          'x-component': 'Input',
                          'x-decorator': 'FormilyFormItem',
                        },
                        name: {
                          type: 'string',
                          title: '权限标识',
                          'x-component': 'Input',
                          'x-decorator': 'FormilyFormItem',
                        },
                      },
                    },
                  },
                },
              },
            },
            [uid()]: {
              type: 'void',
              title: '操作',
              'x-component': 'Table.Operation',
              'x-component-props': {
                className: 'nb-table-operation',
              },
              'x-designable-bar': 'Table.Operation.DesignableBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Action',
                  'x-component-props': {
                    icon: 'EllipsisOutlined',
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Action.Dropdown',
                      'x-component-props': {},
                      properties: {
                        [uid()]: {
                          type: 'void',
                          title: '配置',
                          'x-component': 'Menu.Action',
                          'x-component-props': {
                            style: {
                              minWidth: 150,
                            },
                          },
                          'x-action-type': 'view',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              title: '权限配置',
                              'x-decorator': 'RoleProvider',
                              'x-component': 'Action.Drawer',
                              'x-component-props': {
                                bodyStyle: {
                                  background: '#f0f2f5',
                                  paddingTop: 0,
                                },
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Tabs',
                                  properties: {
                                    [uid()]: {
                                      type: 'void',
                                      title: '数据表操作权限',
                                      'x-component': 'Tabs.TabPane',
                                      'x-component-props': {},
                                      properties: {
                                        collectionSchema,
                                      },
                                    },
                                    [uid()]: {
                                      type: 'void',
                                      title: '菜单访问权限',
                                      'x-component': 'Tabs.TabPane',
                                      'x-component-props': {},
                                      properties: {
                                        menuSchema,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        [uid()]: {
                          type: 'void',
                          title: '编辑',
                          'x-component': 'Menu.Action',
                          'x-action-type': 'update',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              title: '编辑数据',
                              'x-decorator': 'Form',
                              'x-decorator-props': {
                                useResource: useDetailsResource,
                              },
                              'x-component': 'Action.Drawer',
                              'x-component-props': {
                                useOkAction: '{{ Table.useTableUpdateAction }}',
                              },
                              properties: {
                                title: {
                                  type: 'string',
                                  title: '权限名称',
                                  'x-component': 'Input',
                                  'x-decorator': 'FormilyFormItem',
                                },
                              },
                            },
                          },
                        },
                        [uid()]: {
                          type: 'void',
                          title: '删除',
                          'x-component': 'Menu.Action',
                          'x-designable-bar': 'Table.Action.DesignableBar',
                          'x-action-type': 'destroy',
                          'x-component-props': {
                            useAction: '{{ Table.useTableDestroyAction }}',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            column1: {
              type: 'void',
              title: '权限名称',
              'x-component': 'Table.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: '权限标识',
              'x-component': 'Table.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
          },
        },
      },
    },
  },
};

export const Permissions = () => {
  return (
    <SchemaRenderer
      components={{ RoleProvider, ActionPermissionField, MenuPermissionTable }}
      schema={schema}
    />
  );
};

export default Permissions;
