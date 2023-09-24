import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useActionContext, useRequest } from '@nocobase/client';
import { NAMESPACE } from '../locale';

const collection = {
  name: 'storages',
  fields: [
    {
      type: 'integer',
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
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: `{{t("Storage name", { ns: "${NAMESPACE}" })}}`,
        descriptions: `{{t("Will be used for API", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: `{{t("Storage type", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        required: true,
        enum: [
          { label: `{{t("Local storage", { ns: "${NAMESPACE}" })}}`, value: 'local' },
          { label: `{{t("Aliyun OSS", { ns: "${NAMESPACE}" })}}`, value: 'ali-oss' },
          { label: `{{t("Amazon S3", { ns: "${NAMESPACE}" })}}`, value: 's3' },
          { label: `{{t("Tencent COS", { ns: "${NAMESPACE}" })}}`, value: 'tx-cos' },
        ],
      } as ISchema,
    },
    {
      type: 'string',
      name: 'baseUrl',
      interface: 'input',
      uiSchema: {
        title: `{{t("Storage base URL", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'path',
      interface: 'input',
      uiSchema: {
        title: `{{t("Path", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'default',
      interface: 'boolean',
      uiSchema: {
        title: `{{t("Default storage", { ns: "${NAMESPACE}" })}}`,
        type: 'boolean',
        'x-component': 'Checkbox',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'paranoid',
      interface: 'boolean',
      uiSchema: {
        title: `{{t("Keep file in storage when destroy record", { ns: "${NAMESPACE}" })}}`,
        type: 'boolean',
        'x-component': 'Checkbox',
      } as ISchema,
    },
  ],
};

export const storageSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'storages',
        request: {
          resource: 'storages',
          action: 'list',
          params: {
            pageSize: 50,
            sort: ['id'],
            appends: [],
          },
        },
      },
      'x-component': 'CollectionProvider',
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
                    title: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    name: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      description:
                        '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
                    },
                    baseUrl: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    type: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    options: {
                      type: 'object',
                      'x-component': 'StorageOptions',
                    },
                    path: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    default: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      title: '',
                      'x-content': `{{t("Default storage", { ns: "${NAMESPACE}" })}}`,
                    },
                    paranoid: {
                      title: '',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-content': `{{t("Keep file in storage when destroy record", { ns: "${NAMESPACE}" })}}`,
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
            title: {
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
            name: {
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
            default: {
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
                            title: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            name: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-disabled': true,
                            },
                            baseUrl: {
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
                              'x-component': 'StorageOptions',
                            },
                            path: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            default: {
                              title: '',
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-content': `{{t("Default storage", { ns: "${NAMESPACE}" })}}`,
                            },
                            paranoid: {
                              title: '',
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-content': `{{t("Keep file in storage when destroy record", { ns: "${NAMESPACE}" })}}`,
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
                          title: '{{t("Delete")}}',
                          content: '{{t("Are you sure you want to delete it?")}}',
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
