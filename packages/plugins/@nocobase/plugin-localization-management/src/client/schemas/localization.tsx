import { ISchema } from '@formily/react';

const collection = {
  name: 'localization',
  fields: [
    {
      interface: 'input',
      type: 'string',
      name: 'text',
      uiSchema: {
        type: 'string',
        title: '{{t("Text")}}',
        'x-component': 'Input.TextArea',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'translation',
      uiSchema: {
        type: 'string',
        title: '{{t("Translation")}}',
        'x-component': 'Input.TextArea',
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'moduleTitle',
      uiSchema: {
        type: 'string',
        title: '{{t("Module")}}',
        'x-component': 'Select',
        enum: [
          {
            value: 'Menu',
            label: '{{t("Menu")}}',
          },
          {
            value: 'Collections & Fields',
            label: '{{t("Collections & Fields", {ns:"localization-management"})}}',
          },
        ],
      },
    },
  ],
};

export const localizationSchema: ISchema = {
  type: 'void',
  name: 'localization',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    resourceName: 'localizationTexts',
    request: {
      resource: 'localizationTexts',
      action: 'list',
      params: {
        pageSize: 50,
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
        currentLang: {
          type: 'void',
          'x-align': 'left',
          'x-component': 'CurrentLang',
        },
        filter: {
          type: 'void',
          title: '{{t("Filter")}}',
          'x-align': 'left',
          'x-component': 'Filter',
        },
        deleteTranslation: {
          type: 'void',
          title: '{{t("Delete translation")}}',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'DeleteOutlined',
            useAction: '{{ useBulkDestroyTranslationAction }}',
            confirm: {
              title: "{{t('Delete translation')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
          },
        },
        sync: {
          type: 'void',
          title: '{{t("Sync")}}',
          'x-component': 'Sync',
        },
        publish: {
          type: 'void',
          title: '{{t("Publish")}}',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'UploadOutlined',
            type: 'primary',
            useAction: '{{ usePublishAction }}',
          },
        },
      },
    },
    table: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'translationId',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
      },
      properties: {
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
              'x-component-props': {
                component: 'TranslationField',
              },
              'x-read-pretty': true,
            },
          },
        },
        moduleTitle: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            moduleTitle: {
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
                        moduleTitle: {
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
                                useAction: '{{ useUpdateTranslationAction }}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                deleteTranslation: {
                  type: 'void',
                  title: '{{ t("Delete translation") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Delete translation')}}",
                      content: "{{t('Are you sure you want to delete it?')}}",
                    },
                    useAction: '{{useDestroyTranslationAction}}',
                  },
                  'x-visible': '{{useHasTranslation()}}',
                },
                // deleteText: {
                //   type: 'void',
                //   title: '{{ t("Delete Text") }}',
                //   'x-component': 'Action.Link',
                //   'x-component-props': {
                //     confirm: {
                //       title: "{{t('Delete text')}}",
                //       content: "{{t('Are you sure you want to delete it?')}}",
                //     },
                //     useAction: '{{useDestroyTextAction}}',
                //   },
                // },
              },
            },
          },
        },
      },
    },
  },
};
