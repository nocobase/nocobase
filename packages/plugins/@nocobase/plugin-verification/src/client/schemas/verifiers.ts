/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

export const createVerifierSchema = {
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
          'x-validator': (value: string) => {
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'a-z, A-Z, 0-9, _, -';
            }
            return '';
          },
        },
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          title: '{{ t("Title") }}',
          'x-component': 'Input',
        },
        description: {
          'x-decorator': 'FormItem',
          type: 'string',
          title: '{{ t("Description") }}',
          'x-component': 'Input.TextArea',
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

export const verifiersSchema: ISchema = {
  type: 'void',
  name: 'verifiers',
  properties: {
    card: {
      type: 'void',
      'x-component': 'CardItem',
      'x-component-props': {
        heightMode: 'fullHeight',
      },
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'verifiers',
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
            rowKey: 'name',
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
              title: '{{ t("Verification type") }}',
              'x-component': 'TableV2.Column',
              properties: {
                verificationType: {
                  type: 'string',
                  'x-component': 'Select',
                  'x-read-pretty': true,
                  enum: '{{ types }}',
                },
              },
            },
            column4: {
              type: 'void',
              title: '{{ t("Description") }}',
              'x-component': 'TableV2.Column',
              properties: {
                description: {
                  type: 'string',
                  'x-component': 'Input.TextArea',
                  'x-component-props': {
                    ellipsis: true,
                  },
                  'x-pattern': 'readPretty',
                },
              },
            },
            column5: {
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
                            description: {
                              'x-decorator': 'FormItem',
                              type: 'string',
                              title: '{{ t("Description") }}',
                              'x-component': 'Input.TextArea',
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
