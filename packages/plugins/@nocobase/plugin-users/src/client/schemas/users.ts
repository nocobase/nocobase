import { ISchema } from '@formily/react';
import { useActionContext, useCollectionRecord, useRecord, useRequest } from '@nocobase/client';
import { useEffect } from 'react';
import { uid } from '@formily/shared';

export const userCollection = {
  name: 'users',
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
      interface: 'id',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'nickname',
      uiSchema: {
        type: 'string',
        title: '{{t("Nickname")}}',
        'x-component': 'Input',
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'username',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Username")}}',
        'x-component': 'Input',
        'x-validator': { username: true },
        required: true,
      },
    },
    {
      interface: 'email',
      type: 'string',
      name: 'email',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Email")}}',
        'x-component': 'Input',
        'x-validator': 'email',
        required: true,
      },
    },
    {
      interface: 'phone',
      type: 'string',
      name: 'phone',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Phone")}}',
        'x-component': 'Input',
        'x-validator': 'phone',
        required: true,
      },
    },
    {
      interface: 'password',
      type: 'password',
      name: 'password',
      hidden: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Password")}}',
        'x-component': 'Password',
      },
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'roles',
      target: 'roles',
      foreignKey: 'userId',
      otherKey: 'roleName',
      onDelete: 'CASCADE',
      sourceKey: 'id',
      targetKey: 'name',
      through: 'rolesUsers',
      uiSchema: {
        type: 'array',
        title: '{{t("Roles")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    },
    // {
    //   name: 'departments',
    //   type: 'belongsToMany',
    //   interface: 'm2m',
    //   target: 'departments',
    //   foreignKey: 'userId',
    //   otherKey: 'departmentId',
    //   onDelete: 'CASCADE',
    //   sourceKey: 'id',
    //   targetKey: 'id',
    //   through: 'departmentsUsers',
    //   uiSchema: {
    //     type: 'array',
    //     title: '{{t("Departments")}}',
    //     'x-component': 'DepartmentField',
    //   },
    // },
  ],
};

export const usersSchema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection: userCollection,
        resourceName: 'users',
        request: {
          resource: 'users',
          action: 'list',
          params: {
            pageSize: 50,
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
            filter: {
              type: 'void',
              title: '{{ t("Filter") }}',
              'x-action': 'filter',
              'x-component': 'Filter.Action',
              'x-component-props': {
                icon: 'FilterOutlined',
                useProps: '{{ useFilterActionProps }}',
              },
              'x-align': 'left',
            },
            delete: {
              type: 'void',
              title: '{{ t("Delete") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete users')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
                icon: 'DeleteOutlined',
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                icon: 'PlusOutlined',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  title: '{{t("Add user")}}',
                  properties: {
                    nickname: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    username: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    email: {
                      title: '{{t("Email")}}',
                      'x-component': 'Input',
                      'x-validator': 'email',
                      'x-decorator': 'FormItem',
                      required: false,
                    },
                    phone: {
                      title: '{{t("Phone")}}',
                      'x-component': 'Input',
                      'x-validator': 'phone',
                      'x-decorator': 'FormItem',
                      required: false,
                    },
                    password: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      required: true,
                    },
                    roles: {
                      'x-component': 'CollectionField',
                      'x-collection-field': 'users.roles',
                      'x-decorator': 'FormItem',
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{t("Cancel")}}',
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ cm.useCancelAction }}',
                          },
                        },
                        submit: {
                          title: '{{t("Submit")}}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                            useAction: '{{ cm.useCreateAction }}',
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
        table: {
          type: 'void',
          'x-uid': 'input',
          'x-component': 'Table.Void',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ cm.useDataSourceFromRAC }}',
          },
          properties: {
            column1: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                nickname: {
                  type: 'number',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                username: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                email: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              title: '{{t("Roles")}}',
              properties: {
                roles: {
                  type: 'array',
                  'x-component': 'UserRolesField',
                },
              },
            },
            column5: {
              type: 'void',
              title: '{{t("Actions")}}',
              'x-component': 'Table.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    update: {
                      type: 'void',
                      title: '{{t("Edit profile")}}',
                      'x-decorator': 'ACLActionProvider',
                      'x-acl-action': 'users:update',
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
                            useValues: (options) => {
                              const record = useRecord();
                              const result = useRequest(() => Promise.resolve({ data: record }), {
                                ...options,
                                manual: true,
                              });
                              const ctx = useActionContext();
                              useEffect(() => {
                                if (ctx.visible) {
                                  result.run();
                                }
                              }, [ctx.visible]);
                              return result;
                            },
                          },
                          title: '{{t("Edit profile")}}',
                          properties: {
                            nickname: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            username: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            email: {
                              title: '{{t("Email")}}',
                              'x-component': 'Input',
                              'x-validator': 'email',
                              'x-decorator': 'FormItem',
                              required: false,
                            },
                            phone: {
                              title: '{{t("Phone")}}',
                              'x-component': 'Input',
                              'x-validator': 'phone',
                              'x-decorator': 'FormItem',
                              required: false,
                            },
                            roles: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-collection-field': 'users.roles',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                cancel: {
                                  title: '{{t("Cancel")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    useAction: '{{ cm.useCancelAction }}',
                                  },
                                },
                                submit: {
                                  title: '{{t("Submit")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                    useAction: '{{ cm.useUpdateAction }}',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    changePassword: {
                      type: 'void',
                      title: '{{t("Change password")}}',
                      'x-decorator': 'ACLActionProvider',
                      'x-acl-action': 'users:update',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        type: 'primary',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'Form',
                          title: '{{t("Change password")}}',
                          properties: {
                            password: {
                              'x-component': 'CollectionField',
                              'x-component-props': {
                                component: 'PasswordField',
                              },
                              'x-decorator': 'FormItem',
                              required: true,
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                cancel: {
                                  title: '{{t("Cancel")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    useAction: '{{ cm.useCancelAction }}',
                                  },
                                },
                                submit: {
                                  title: '{{t("Submit")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                    useAction: '{{ cm.useUpdateAction }}',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-acl-action': 'users:destroy',
                      'x-action': 'destroy',
                      'x-decorator': 'ACLActionProvider',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: "{{t('Delete')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: '{{cm.useDestroyAction}}',
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

export const getRoleUsersSchema = (): ISchema => ({
  type: 'void',
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
        [uid()]: {
          type: 'void',
          title: '{{ t("Filter") }}',
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-component-props': {
            icon: 'FilterOutlined',
            useProps: '{{ useFilterActionProps }}',
          },
          'x-align': 'left',
        },
        actions: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            remove: {
              type: 'void',
              title: '{{t("Remove")}}',
              'x-component': 'Action',
              'x-component-props': {
                icon: 'MinusOutlined',
                confirm: {
                  title: "{{t('Remove')}}",
                  content: "{{t('Are you sure you want to remove these users?')}}",
                },
                style: {
                  marginRight: 8,
                },
                useAction: '{{ useBulkRemoveUsers }}',
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add users")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                icon: 'PlusOutlined',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'FormV2',
                  title: '{{t("Add users")}}',
                  properties: {
                    resource: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'RoleUsersProvider',
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
                            filter: {
                              type: 'void',
                              title: '{{ t("Filter") }}',
                              default: {
                                $and: [{ username: { $includes: '' } }, { nickname: { $includes: '' } }],
                              },
                              'x-action': 'filter',
                              'x-component': 'Filter.Action',
                              'x-component-props': {
                                icon: 'FilterOutlined',
                                useProps: '{{ useFilterActionProps }}',
                              },
                              'x-align': 'left',
                            },
                          },
                        },
                        table: {
                          type: 'void',
                          'x-component': 'Table.Void',
                          'x-component-props': {
                            rowKey: 'id',
                            rowSelection: {
                              type: 'checkbox',
                              onChange: '{{ handleSelectRoleUsers }}',
                            },
                            useDataSource: '{{ cm.useDataSourceFromRAC }}',
                          },
                          properties: {
                            username: {
                              type: 'void',
                              'x-decorator': 'Table.Column.Decorator',
                              'x-component': 'Table.Column',
                              properties: {
                                username: {
                                  type: 'string',
                                  'x-component': 'CollectionField',
                                  'x-read-pretty': true,
                                },
                              },
                            },
                            nickname: {
                              type: 'void',
                              'x-decorator': 'Table.Column.Decorator',
                              'x-component': 'Table.Column',
                              properties: {
                                nickname: {
                                  type: 'string',
                                  'x-component': 'CollectionField',
                                  'x-read-pretty': true,
                                },
                              },
                            },
                            phone: {
                              type: 'void',
                              'x-decorator': 'Table.Column.Decorator',
                              'x-component': 'Table.Column',
                              properties: {
                                phone: {
                                  type: 'string',
                                  'x-component': 'CollectionField',
                                  'x-read-pretty': true,
                                },
                              },
                            },
                            email: {
                              type: 'void',
                              'x-decorator': 'Table.Column.Decorator',
                              'x-component': 'Table.Column',
                              properties: {
                                email: {
                                  type: 'string',
                                  'x-component': 'CollectionField',
                                  'x-read-pretty': true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{t("Cancel")}}',
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ cm.useCancelAction }}',
                          },
                        },
                        submit: {
                          title: '{{t("Submit")}}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                            useAction: '{{ useAddRoleUsers }}',
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
    table: {
      type: 'void',
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
      },
      properties: {
        username: {
          type: 'void',
          title: '{{t("Username")}}',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            username: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        nickname: {
          type: 'void',
          title: '{{t("Nickname")}}',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            nickname: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'Table.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                remove: {
                  type: 'void',
                  title: '{{ t("Remove") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Remove user')}}",
                      content: "{{t('Are you sure you want to remove it?')}}",
                    },
                    useAction: '{{ useRemoveUser }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
