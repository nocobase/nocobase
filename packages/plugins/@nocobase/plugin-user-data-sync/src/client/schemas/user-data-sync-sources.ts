/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';

export const sourceCollection = {
  name: 'userDataSyncSources',
  sortable: true,
  filterTargetKey: 'id',
  fields: [
    {
      name: 'id',
      type: 'string',
      interface: 'id',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'name',
      uiSchema: {
        type: 'string',
        title: '{{t("Source name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'sourceType',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Select',
        required: true,
        dataSource: '{{ types }}',
      },
    },
    // {
    //   interface: 'input',
    //   type: 'string',
    //   name: 'displayName',
    //   uiSchema: {
    //     type: 'string',
    //     title: '{{t("Source display name")}}',
    //     'x-component': 'Input',
    //   },
    // },
    {
      type: 'boolean',
      name: 'enabled',
      uiSchema: {
        type: 'boolean',
        title: '{{t("Enabled")}}',
        'x-component': 'Checkbox',
      },
    },
  ],
};

export const taskCollection = {
  name: 'userDataSyncTasks',
  filterTargetKey: 'id',
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      interface: 'id',
    },
    {
      name: 'batch',
      interface: 'input',
      type: 'string',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Batch")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'source',
      interface: 'input',
      type: 'belongsTo',
      target: 'userDataSyncSources',
      targetKey: 'id',
      foreignKey: 'sourceId',
      allowNull: false,
      uiSchema: {
        type: 'object',
        title: '{{t("Source")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'name',
          },
        },
        required: true,
        'x-read-pretty': true,
      },
    },
    {
      name: 'status',
      interface: 'input',
      type: 'string',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        required: true,
        enum: [
          { label: '{{t("Init")}}', value: 'init', color: 'default' },
          { label: '{{t("Processing")}}', value: 'processing', color: 'processing' },
          { label: '{{t("Success")}}', value: 'success', color: 'success' },
          { label: '{{t("Failed")}}', value: 'failed', color: 'error' },
        ],
      },
    },
    {
      name: 'message',
      interface: 'input',
      type: 'string',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Message")}}',
        'x-component': 'Input',
        required: false,
      },
    },
    {
      name: 'cost',
      interface: 'input',
      type: 'integer',
      allowNull: true,
      uiSchema: {
        type: 'integer',
        title: '{{t("Cost")}}',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        required: false,
      },
    },
  ],
};

export const createFormSchema: ISchema = {
  type: 'object',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      title: '{{t("Add new")}}',
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCustomFormProps',
          properties: {
            name: {
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
            },
            sourceType: {
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
              'x-component-props': {
                options: '{{ types }}',
              },
            },
            // displayName: {
            //   'x-component': 'CollectionField',
            //   'x-decorator': 'FormItem',
            // },
            enabled: {
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
            },
            options: {
              type: 'object',
              'x-component': 'Options',
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.Footer',
              properties: {
                submit: {
                  title: '{{t("Submit")}}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useSubmitActionProps',
                  'x-component-props': {
                    type: 'primary',
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

export const tasksTableBlockSchema: ISchema = {
  type: 'object',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      title: '{{ t("Tasks") }}',
      properties: {
        table: {
          type: 'void',
          'x-decorator': 'TableBlockProvider',
          'x-use-decorator-props': 'useTasksTableBlockProps',
          'x-decorator-props': {
            collection: taskCollection.name,
            dragSort: false,
            action: 'list',
            showIndex: true,
          },
          properties: {
            table: {
              type: 'array',
              'x-component': 'TableV2',
              'x-use-component-props': 'useTableBlockProps',
              'x-component-props': {
                rowKey: 'id',
              },
              properties: {
                batch: {
                  type: 'void',
                  title: '{{ t("Batch") }}',
                  'x-component': 'TableV2.Column',
                  properties: {
                    batch: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-pattern': 'readPretty',
                    },
                  },
                },
                status: {
                  type: 'void',
                  title: '{{ t("Status") }}',
                  'x-component': 'TableV2.Column',
                  properties: {
                    status: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-pattern': 'readPretty',
                    },
                  },
                },
                message: {
                  type: 'void',
                  title: '{{ t("Message") }}',
                  'x-component': 'TableV2.Column',
                  properties: {
                    message: {
                      type: 'string',
                      'x-component': 'Message',
                    },
                  },
                },
                actions: {
                  type: 'void',
                  title: '{{t("Actions")}}',
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
                        sync: {
                          type: 'void',
                          'x-component': 'Retry',
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

export const userDataSyncSourcesSchema: ISchema = {
  type: 'void',
  name: 'userDataSyncSources',
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: sourceCollection.name,
    dragSort: false,
    action: 'list',
    params: {
      pageSize: 10,
    },
    showIndex: true,
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
          'x-use-component-props': 'useBulkDestroyActionProps',
          'x-component-props': {
            icon: 'DeleteOutlined',
            confirm: {
              title: "{{t('Delete')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
          },
        },
        create: {
          type: 'void',
          title: '{{t("Add new")}}',
          'x-component': 'AddNew',
          'x-component-props': {
            type: 'primary',
          },
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
        name: {
          type: 'void',
          title: '{{t("Source name")}}',
          'x-component': 'TableV2.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        // displayName: {
        //   type: 'void',
        //   title: '{{t("Source display name")}}',
        //   'x-component': 'TableV2.Column',
        //   properties: {
        //     displayName: {
        //       type: 'string',
        //       'x-component': 'CollectionField',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        sourceType: {
          type: 'void',
          title: '{{t("Type")}}',
          'x-component': 'TableV2.Column',
          properties: {
            sourceType: {
              type: 'string',
              'x-component': 'Select',
              'x-pattern': 'readPretty',
              enum: '{{ types }}',
            },
          },
        },
        enabled: {
          type: 'void',
          title: '{{t("Enabled")}}',
          'x-component': 'TableV2.Column',
          properties: {
            enabled: {
              type: 'boolean',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
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
                sync: {
                  type: 'void',
                  title: '{{ t("Sync") }}',
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useSyncActionProps',
                },
                tasks: {
                  type: 'void',
                  title: '{{ t("Tasks") }}',
                  'x-component': 'Tasks',
                  'x-component-props': {
                    type: 'primary',
                  },
                },
                edit: {
                  type: 'void',
                  title: '{{t("Configure")}}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
                    openMode: 'drawer',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      title: '{{t("Configure")}}',
                      properties: {
                        form: {
                          type: 'void',
                          'x-component': 'FormV2',
                          'x-use-component-props': 'useEditFormProps',
                          properties: {
                            name: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            sourceType: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                              'x-component-props': {
                                options: '{{ types }}',
                              },
                            },
                            // displayName: {
                            //   'x-component': 'CollectionField',
                            //   'x-decorator': 'FormItem',
                            // },
                            enabled: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            options: {
                              type: 'object',
                              'x-component': 'Options',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                submit: {
                                  title: '{{t("Submit")}}',
                                  'x-component': 'Action',
                                  'x-use-component-props': 'useSubmitActionProps',
                                  'x-component-props': {
                                    type: 'primary',
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
                delete: {
                  type: 'void',
                  title: '{{ t("Delete") }}',
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useDeleteActionProps',
                },
              },
            },
          },
        },
      },
    },
  },
};
