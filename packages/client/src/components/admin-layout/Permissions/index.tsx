import { SchemaRenderer, useResourceRequest } from '../../../';
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
import { useTranslation } from 'react-i18next';

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
  const resource = useResourceRequest('roles');
  return {
    resource,
  };
};

const useCollectionsResource = () => {
  const descriptionsContext = useContext(DescriptionsContext);
  console.log('descriptionsContext.service', descriptionsContext.service);
  const resource = useResourceRequest('collections');
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
  const resource = useResourceRequest({
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
  const resource = useResourceRequest(
    {
      resourceName: 'action_permissions',
    },
    ActionPermissionResource,
  );
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
            const item: any = {};
            Object.keys(permission).forEach((key) => {
              if (isValid(permission[key])) {
                item[key] = permission[key];
              }
            });
            item.fields = permission?.fields.map((field) => field.key) || [];
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
  const resource = useResourceRequest({
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
    column1: {
      type: 'void',
      title: '{{t("Collection display name")}}',
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
      title: '{{t("Collection name")}}',
      'x-component': 'Table.Column',
      properties: {
        name: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
    column3: {
      type: 'void',
      title: '{{t("Actions")}}',
      'x-component': 'Table.Column',
      'x-component-props': {
        width: 60,
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Action.Group',
          'x-component-props': {
            type: 'link',
          },
          properties: {
            [uid()]: {
              type: 'void',
              title: '{{t("Configure")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'link',
              },
              'x-action-type': 'view',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '{{t("Collection action permissions")}}',
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
};

const menuSchema: ISchema = {
  type: 'array',
  'x-component': 'MenuPermissionTable',
};

export const Permissions = () => {
  const { t } = useTranslation();
  const schema: ISchema = {
    type: 'void',
    name: 'action',
    'x-component': 'Action',
    'x-component-props': {
      tooltip: '{{ t("Roles & Permissions") }}',
      className: 'nb-database-config',
      icon: 'LockOutlined',
      type: 'primary',
    },
    properties: {
      modal1: {
        type: 'void',
        title: '{{t("Roles")}}',
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
                    title: '{{t("Delete")}}',
                    'x-align': 'right',
                    'x-decorator': 'AddNew.Displayed',
                    'x-decorator-props': {
                      displayName: 'destroy',
                    },
                    'x-component': 'Action',
                    'x-component-props': {
                      icon: 'DeleteOutlined',
                      confirm: {
                        title: '{{t("Delete record")}}',
                        content: '{{t("Are you sure you want to delete it?")}}',
                      },
                      useAction: '{{ Table.useTableDestroyAction }}',
                    },
                  },
                  [uid()]: {
                    type: 'void',
                    title: '{{t("Add new")}}',
                    'x-align': 'right',
                    'x-decorator': 'AddNew.Displayed',
                    'x-decorator-props': {
                      displayName: 'create',
                    },
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                      icon: 'PlusOutlined',
                    },
                    properties: {
                      modal: {
                        type: 'void',
                        title: '{{t("Add new role")}}',
                        'x-decorator': 'Form',
                        'x-component': 'Action.Drawer',
                        'x-component-props': {
                          useOkAction: '{{ Table.useTableCreateAction }}',
                        },
                        properties: {
                          title: {
                            type: 'string',
                            title: '{{t("Role name")}}',
                            'x-component': 'Input',
                            'x-decorator': 'FormilyFormItem',
                          },
                          // name: {
                          //   type: 'string',
                          //   title: '角色标识',
                          //   'x-component': 'Input',
                          //   'x-decorator': 'FormilyFormItem',
                          // },
                        },
                      },
                    },
                  },
                },
              },
              column1: {
                type: 'void',
                title: '{{t("Role name")}}',
                'x-component': 'Table.Column',
                properties: {
                  title: {
                    type: 'string',
                    'x-component': 'Input',
                    'x-read-pretty': true,
                  },
                },
              },
              // column2: {
              //   type: 'void',
              //   title: '角色标识',
              //   'x-component': 'Table.Column',
              //   properties: {
              //     name: {
              //       type: 'string',
              //       'x-component': 'Input',
              //       'x-read-pretty': true,
              //     },
              //   },
              // },
              [uid()]: {
                type: 'void',
                title: '{{t("Actions")}}',
                'x-component': 'Table.Column',
                'x-component-props': {
                  width: 160,
                },
                properties: {
                  [uid()]: {
                    type: 'void',
                    'x-component': 'Action.Group',
                    'x-component-props': {
                      type: 'link',
                    },
                    properties: {
                      [uid()]: {
                        type: 'void',
                        title: '{{t("Configure")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'link',
                        },
                        'x-action-type': 'view',
                        properties: {
                          [uid()]: {
                            type: 'void',
                            title: '{{t("Configure permissions")}}',
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
                                    title: '{{t("Collection action permissions")}}',
                                    'x-component': 'Tabs.TabPane',
                                    'x-component-props': {},
                                    properties: {
                                      collectionSchema,
                                    },
                                  },
                                  [uid()]: {
                                    type: 'void',
                                    title: '{{t("Menu access permissions")}}',
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
                        title: '{{t("Edit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'link',
                        },
                        'x-action-type': 'update',
                        properties: {
                          [uid()]: {
                            type: 'void',
                            title: '{{t("Edit role")}}',
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
                                title: '{{t("Role name")}}',
                                'x-component': 'Input',
                                'x-decorator': 'FormilyFormItem',
                              },
                            },
                          },
                        },
                      },
                      [uid()]: {
                        type: 'void',
                        title: '{{t("Delete")}}',
                        'x-component': 'Action',
                        'x-designable-bar': 'Table.Action.DesignableBar',
                        'x-action-type': 'destroy',
                        'x-component-props': {
                          type: 'link',
                          confirm: {
                            title: '{{t("Delete record")}}',
                            content: "{{t('Are you sure you want to delete it?')}}",
                          },
                          useAction: '{{ Table.useTableDestroyAction }}',
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

  return (
    <SchemaRenderer
      scope={{ t }}
      components={{ RoleProvider, ActionPermissionField, MenuPermissionTable }}
      schema={schema}
    />
  );
};

export default Permissions;
