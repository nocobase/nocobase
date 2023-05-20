import { TRANSLATION_ALIAS } from '../../server/constant';

const collection = {
  name: 'localization_management_providers',
  fields: [
    {
      type: 'string',
      name: 'module',
      interface: 'Select',
      uiSchema: {
        title: `{{ localManageLang("module") }}`,
        type: 'string',
        'x-component': 'Select',
        enum: '{{moduleEnum}}',
      },
    },
    {
      type: 'string',
      name: 'text',
      interface: 'input',
      uiSchema: {
        title: `{{ localManageLang("text") }}`,
        type: 'string',
        'x-component': 'Input.TextArea',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'translation',
      interface: 'input',
      uiSchema: {
        title: `{{ localManageLang("translation") }}`,
        type: 'string',
        'x-component': 'Input.TextArea',
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
  name: 'localization_management',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    association: {
      sourceKey: 'id',
    },
    resourceName: 'localization_management_texts',
    request: {
      resource: TRANSLATION_ALIAS,
      action: 'query',
      params: {
        pageSize: 50,
        sort: ['-default', 'id'],
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
        description: {
          type: 'void',
          'x-align': 'left',
          'x-component': 'div',
          'x-component-props': {
            style: {
              display: 'flex',
            },
          },
          properties: {
            label: {
              'x-component': 'span',
              'x-content': `{{ localManageLang("current language") }}`,
            },
            separator: {
              'x-component': 'span',
              'x-content': '：',
            },
            currentLang: {
              type: 'string',
              'x-component': 'Select',
              enum: '{{langEnum}}',
              default: '{{langEnum?.[0].value}}',
              'x-read-pretty': true,
            },
          },
        },
        delete: {
          type: 'void',
          title: '{{t("Delete")}}',
          'x-component': 'Action',
          'x-component-props': {
            resource: TRANSLATION_ALIAS,
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
              title: '{{t("Add new")}}',
              properties: {
                module: {
                  'x-decorator': 'FormItem',
                  'x-component': 'CollectionField',
                  default: '{{moduleEnum?.[0]?.value}}',
                  enum: '{{moduleEnum}}',
                },
                text: {
                  'x-decorator': 'FormItem',
                  'x-component': 'CollectionField',
                },
                translation: {
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
        module: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            module: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        text: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            text: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        translation: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            translation: {
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
                        module: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-read-pretty': true,
                        },
                        text: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-read-pretty': true,
                        },
                        translation: {
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
