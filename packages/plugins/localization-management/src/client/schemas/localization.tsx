import { ISchema } from '@formily/react';

const collection = {
  name: 'localization',
  fields: [
    {
      interface: 'input',
      type: 'string',
      name: 'module',
      uiSchema: {
        type: 'string',
        title: '{{t("Module")}}',
        'x-component': 'Select',
        required: true,
        enum: '{{ useModules()}}',
      },
    },
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
  ],
};

export const localizationSchema: ISchema = {
  type: 'void',
  name: 'localization',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    resourceName: 'localization',
    request: {
      resource: 'localization',
      action: 'list',
      params: {
        pageSize: 50,
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
        // module: {
        //   type: 'void',
        //   'x-decorator': 'Table.Column.Decorator',
        //   'x-component': 'Table.Column',
        //   properties: {
        //     module: {
        //       type: 'string',
        //       'x-component': 'CollectionField',
        //       'x-read-pretty': true,
        //     },
        //   },
        // },
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
                        // module: {
                        //   'x-component': 'CollectionField',
                        //   'x-decorator': 'FormItem',
                        //   'x-read-pretty': true,
                        // },
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
                                useAction: '{{ cm.useUpdateAction }}',
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

export const filterSchema: ISchema = {
  type: 'object',
  properties: {
    search: {
      type: 'void',
      'x-decorator': 'FormItem',
      'x-component': 'Input.Group',
      'x-component-props': {
        compact: true,
      },
      properties: {
        searchType: {
          type: 'string',
          'x-component': 'Select',
          'x-component-props': {
            showSearch: false,
            style: {
              width: '30%',
            },
          },
          default: 'text',
          enum: [
            { label: "{{t('Text')}}", value: 'text' },
            { label: "{{t('Translation')}}", value: 'translation' },
          ],
        },
        keyword: {
          type: 'string',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: "{{t('Keyword')}}",
            allowClear: true,
            style: {
              width: '70%',
            },
          },
        },
      },
    },
    action: {
      type: 'void',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        hasTranslation: {
          type: 'boolean',
          'x-component': 'Radio.Group',
          'x-component-props': {
            optionType: 'button',
            defaultValue: true,
          },
          enum: [
            { label: "{{t('All')}}", value: true },
            { label: "{{t('No translation')}}", value: false },
          ],
          'x-reactions': {
            dependencies: ['.searchType'],
            fulfill: {
              state: {
                disabled: '{{$deps[0] === "translation"}}',
              },
            },
          },
        },
        reset: {
          type: 'void',
          title: '{{t("Reset")}}',
          'x-component': 'Action',
          'x-component-props': {
            style: {
              marginLeft: 20,
            },
            useAction: '{{ useReset }}',
          },
        },
        submit: {
          type: 'void',
          title: '{{t("Submit")}}',
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            useAction: '{{ useSearch }}',
          },
        },
      },
    },
  },
};
