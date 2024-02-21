import { ISchema } from '@formily/react';
import { useActionContext, useRequest } from '@nocobase/client';

const collection = {
  name: 'samlProviders',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Title")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'clientId',
      interface: 'input',
      uiSchema: {
        title: '{{t("Client id")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'issuer',
      interface: 'input',
      uiSchema: {
        title: '{{t("Entity id or issuer")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'loginUrl',
      interface: 'input',
      uiSchema: {
        title: '{{t("Login Url")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'certificate',
      interface: 'input',
      uiSchema: {
        title: '{{t("Public cert")}}',
        type: 'string',
        'x-component': 'Input.TextArea',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'certificate',
      interface: 'input',
      uiSchema: {
        title: '{{t("Public cert")}}',
        type: 'string',
        'x-component': 'Input.TextArea',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'redirectUrl',
      interface: 'input',
      uiSchema: {
        title: '{{t("Redirect url")}}',
        type: 'string',
        'x-component': 'RedirectURLInput',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'enabled',
      interface: 'boolean',
      uiSchema: {
        title: '{{t("Enable")}}',
        type: 'boolean',
        'x-component': 'Checkbox',
      } as ISchema,
    },
  ],
};

export const formProperties = {
  title: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    description: '{{t("Sign in button name, which will be displayed on the sign in page")}}',
  },
  clientId: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  issuer: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  loginUrl: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  certificate: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  redirectUrl: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  enabled: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    title: '',
    'x-content': '{{t("Enable")}}',
  },
};

export const samlSchema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'samlProviders',
        request: {
          resource: 'samlProviders',
          action: 'list',
          params: {
            pageSize: 50,
            sort: ['id'],
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
          properties: {
            delete: {
              type: 'void',
              title: '{{ t("Delete") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete provider')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add provider")}}',
              'x-component': 'Action',
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
                      const ctx = useActionContext();
                      // 初始化数据
                      return useRequest(
                        () =>
                          Promise.resolve({
                            data: {
                              enable: true,
                            },
                          }),
                        { ...options, refreshDeps: [ctx.visible] },
                      );
                    },
                  },
                  title: '{{t("Add provider")}}',
                  properties: {
                    ...formProperties,
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
                title: {
                  type: 'string',
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
                redirectUrl: {
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
              properties: {
                enabled: {
                  type: 'boolean',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
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
                      title: '{{t("Edit")}}',
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
                            useValues: '{{ cm.useValuesFromRecord }}',
                          },
                          title: '{{t("Edit provider")}}',
                          properties: {
                            ...formProperties,
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
