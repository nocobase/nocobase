import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import pick from 'lodash/pick';
import { useEffect } from 'react';
import { useRequest, useRecord_deprecated, useActionContext } from '@nocobase/client';
import { roleCollectionsSchema } from './roleCollections';

const collection = {
  name: 'roles',
  filterTargetKey: 'name',
  targetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Role display name")}}',
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
        title: '{{t("Role UID")}}',
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'default',
      interface: 'boolean',
      uiSchema: {
        title: '{{t("Default role")}}',
        type: 'boolean',
        'x-component': 'Checkbox',
      } as ISchema,
    },
  ],
};

export const roleSchema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'roles',
        request: {
          resource: 'roles',
          action: 'list',
          params: {
            pageSize: 50,
            filter: {
              'name.$ne': 'root',
            },
            showAnonymous: true,
            sort: ['createdAt'],
            appends: [],
          },
        },
      },
      'x-component': 'CollectionProvider_deprecated',
      'x-component-props': {
        collection,
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
          properties: {},
        },
        table: {
          type: 'void',
          'x-uid': 'input',
          'x-component': 'Table.Void',
          'x-component-props': {
            rowKey: 'name',
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
                title: {
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
                name: {
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
                default: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
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
                    view: {
                      type: 'void',
                      title: '{{t("Configure")}}',
                      'x-component': 'Action.Link',
                      'x-decorator': 'ACLActionProvider',
                      'x-acl-action': 'roles:update',
                      'x-component-props': {},
                      properties: {
                        drawer: {
                          type: 'void',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'PermissionProvider',
                          title: '{{t("Configure permissions")}}',
                          properties: {
                            tabs1: {
                              type: 'void',
                              'x-component': 'Tabs',
                              'x-component-props': {},
                              properties: {
                                tab1: {
                                  type: 'void',
                                  title: '{{t("General permissions")}}',
                                  'x-component': 'Tabs.TabPane',
                                  'x-component-props': {},
                                  properties: {
                                    role: {
                                      'x-component': 'RoleConfigure',
                                    },
                                  },
                                },
                                tab2: {
                                  type: 'void',
                                  title: '{{t("Action permissions")}}',
                                  'x-component': 'Tabs.TabPane',
                                  'x-component-props': {},
                                  properties: {
                                    roleCollectionsSchema,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    update: {
                      type: 'void',
                      title: '{{t("Edit")}}',
                      'x-decorator': 'ACLActionProvider',
                      'x-acl-action': 'roles:update',
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
                              const record = useRecord_deprecated();
                              const result = useRequest(
                                () => Promise.resolve({ data: pick(record, ['title', 'name', 'default']) }),
                                {
                                  ...options,
                                  manual: true,
                                },
                              );
                              const ctx = useActionContext();
                              useEffect(() => {
                                if (ctx.visible) {
                                  result.run();
                                }
                              }, [ctx.visible]);
                              return result;
                            },
                          },
                          title: '{{t("Edit role")}}',
                          properties: {
                            title: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            name: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-disabled': true,
                            },
                            default: {
                              title: '',
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-content': '{{t("Default role")}}',
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
                      'x-acl-action': 'roles:destroy',
                      'x-decorator': 'ACLActionProvider',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: "{{t('Delete role')}}",
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
