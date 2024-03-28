import { uid } from '@formily/shared';
import { useActionContext, useRequest } from '@nocobase/client';
import { NAMESPACE } from '../locale';

const collection = {
  name: 'verifications_providers',
  fields: [
    {
      type: 'string',
      name: 'id',
      interface: 'input',
      uiSchema: {
        title: '{{t("ID")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Title")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: `{{t("Provider type", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        required: true,
        enum: [
          { label: `{{t("Aliyun SMS", { ns: "${NAMESPACE}" })}}`, value: 'sms-aliyun' },
          { label: `{{t("Tencent SMS", { ns: "${NAMESPACE}" })}}`, value: 'sms-tencent' },
        ],
      },
    },
    {
      type: 'radio',
      name: 'default',
      interface: 'checkbox',
      uiSchema: {
        title: '{{t("Default")}}',
        type: 'boolean',
        'x-component': 'Checkbox',
      },
    },
  ],
};

export default {
  type: 'void',
  name: 'providers',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    resourceName: 'verifications_providers',
    request: {
      resource: 'verifications_providers',
      action: 'list',
      params: {
        pageSize: 50,
        sort: ['-default', 'id'],
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
          title: '{{t("Delete")}}',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'DeleteOutlined',
            useAction: '{{ cm.useBulkDestroyAction }}',
            confirm: {
              title: "{{t('Delete')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
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
              'x-decorator-props': {
                useValues(options) {
                  const ctx = useActionContext();
                  return useRequest(
                    () =>
                      Promise.resolve({
                        data: {
                          name: `s_${uid()}`,
                        },
                      }),
                    { ...options, refreshDeps: [ctx.visible] },
                  );
                },
              },
              title: '{{t("Add new")}}',
              properties: {
                id: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                  description:
                    '{{t("Identifier for program usage. Support letters, numbers and underscores, must start with an letter.")}}',
                },
                title: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                },
                type: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                },
                options: {
                  type: 'object',
                  'x-component': 'ProviderOptions',
                },
                default: {
                  'x-component': 'CollectionField',
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
        id: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            id: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        title: {
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
        type: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            type: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        default: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            default: {
              type: 'boolean',
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
                      title: '{{t("Edit")}}',
                      properties: {
                        id: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                        },
                        title: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                        },
                        type: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-disabled': true,
                        },
                        options: {
                          type: 'object',
                          'x-component': 'ProviderOptions',
                        },
                        default: {
                          'x-component': 'CollectionField',
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
                      title: "{{t('Delete record')}}",
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
};
