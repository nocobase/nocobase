/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const createLLMSchema = {
  type: 'void',
  properties: {
    drawer: {
      type: 'void',
      title: '{{ t("Add new") }}',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useCreateFormProps',
      properties: {
        name: {
          type: 'string',
          'x-decorator': 'FormItem',
          title: '{{ t("UID") }}',
          'x-component': 'Input',
        },
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          title: '{{ t("Title") }}',
          'x-component': 'Input',
        },
        options: {
          type: 'object',
          'x-component': 'Settings',
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{ t("Cancel") }}',
              'x-component': 'Action',
              'x-use-component-props': 'useCancelActionProps',
            },
            submit: {
              title: '{{ t("Submit") }}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              'x-use-component-props': 'useCreateActionProps',
            },
          },
        },
      },
    },
  },
};

export const llmsSchema = {
  type: 'void',
  name: 'llm-services',
  properties: {
    card: {
      type: 'void',
      'x-component': 'CardItem',
      'x-component-props': {
        heightMode: 'fullHeight',
      },
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'llmServices',
        action: 'list',
      },
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            style: {
              marginBottom: 20,
            },
          },
          properties: {
            filter: {
              'x-component': 'Filter.Action',
              'x-use-component-props': 'useFilterActionProps',
              title: "{{t('Filter')}}",
              'x-component-props': {
                icon: 'FilterOutlined',
              },
              'x-align': 'left',
            },
            refresh: {
              title: "{{t('Refresh')}}",
              'x-component': 'Action',
              'x-use-component-props': 'useRefreshActionProps',
              'x-component-props': {
                icon: 'ReloadOutlined',
              },
            },
            bulkDelete: {
              title: "{{t('Delete')}}",
              'x-action': 'destroy',
              'x-component': 'Action',
              'x-use-component-props': 'useBulkDestroyActionProps',
              'x-component-props': {
                icon: 'DeleteOutlined',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            add: {
              type: 'void',
              'x-component': 'AddNew',
              title: "{{t('Add new')}}",
              'x-align': 'right',
            },
          },
        },
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: '{{ t("UID") }}',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: '{{ t("Title") }}',
              'x-component': 'TableV2.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              title: '{{ t("Provider") }}',
              'x-component': 'TableV2.Column',
              properties: {
                provider: {
                  type: 'string',
                  'x-component': 'Select',
                  'x-read-pretty': true,
                  enum: '{{ providers }}',
                },
              },
            },
            column4: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-decorator': 'TableV2.Column.ActionBar',
              'x-component': 'TableV2.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    edit: {
                      type: 'void',
                      title: '{{ t("Edit") }}',
                      'x-action': 'update',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        openMode: 'drawer',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Edit record") }}',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'FormV2',
                          'x-use-decorator-props': 'useEditFormProps',
                          properties: {
                            title: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              title: '{{ t("Title") }}',
                              'x-component': 'Input',
                            },
                            options: {
                              type: 'object',
                              'x-component': 'Settings',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                cancel: {
                                  title: '{{ t("Cancel") }}',
                                  'x-component': 'Action',
                                  'x-use-component-props': 'useCancelActionProps',
                                },
                                submit: {
                                  title: '{{ t("Submit") }}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                  },
                                  'x-use-component-props': 'useEditActionProps',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    destroy: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-action': 'destroy',
                      'x-component': 'Action.Link',
                      'x-use-component-props': 'useDestroyActionProps',
                      'x-component-props': {
                        confirm: {
                          title: "{{t('Delete record')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
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
};
