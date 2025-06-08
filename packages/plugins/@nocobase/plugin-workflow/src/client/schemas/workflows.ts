/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema } from '@formily/react';

import { css, useCollectionRecordData } from '@nocobase/client';

import { NAMESPACE } from '../locale';
import { executionSchema } from './executions';
import workflowCollection from '../../common/collections/workflows';

function ExecutedLink(props) {
  const record = useCollectionRecordData();
  return React.createElement('a', {
    'aria-label': `executed-${record.title}`,
    ...props,
  });
}

const workflowFieldset = {
  title: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  type: {
    'x-decorator': 'FormItem',
    title: `{{t("Trigger type", { ns: "${NAMESPACE}" })}}`,
    'x-component': 'Select',
    'x-component-props': {
      optionRender: '{{TriggerOptionRender}}',
      popupMatchSelectWidth: true,
      listHeight: 300,
    },
    enum: '{{useTriggersOptions()}}',
    required: true,
  },
  sync: {
    type: 'boolean',
    title: `{{ t("Execute mode", { ns: "${NAMESPACE}" }) }}`,
    description: `{{ t("Execute workflow asynchronously or synchronously based on trigger type, and could not be changed after created.", { ns: "${NAMESPACE}" }) }}`,
    'x-decorator': 'FormItem',
    'x-component': 'SyncOptionSelect',
    'x-component-props': {
      options: [
        {
          label: `{{ t("Asynchronously", { ns: "${NAMESPACE}" }) }}`,
          value: false,
          tooltip: `{{ t("Will be executed in the background as a queued task.", { ns: "${NAMESPACE}" }) }}`,
        },
        {
          label: `{{ t("Synchronously", { ns: "${NAMESPACE}" }) }}`,
          value: true,
          tooltip: `{{ t("For user actions that require immediate feedback. Can not use asynchronous nodes in such mode, and it is not recommended to perform time-consuming operations under synchronous mode.", { ns: "${NAMESPACE}" }) }}`,
        },
      ],
    },
  },
  enabled: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  description: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  categories: {
    type: 'array',
    title: `{{ t("Category", { ns: "${NAMESPACE}" }) }}`,
    'x-decorator': 'FormItem',
    'x-component': 'CollectionField',
    'x-collection-field': 'workflows.categories',
  },
  options: {
    type: 'object',
    'x-component': 'fieldset',
    properties: {
      deleteExecutionOnStatus: {
        type: 'array',
        title: `{{ t("Auto delete history when execution is on end status", { ns: "${NAMESPACE}" }) }}`,
        'x-decorator': 'FormItem',
        'x-component': 'ExecutionStatusSelect',
        'x-component-props': {
          multiple: true,
        },
      },
      stackLimit: {
        type: 'number',
        title: `{{ t("Maximum number of cycling triggers", { ns: "${NAMESPACE}" }) }}`,
        description: `{{ t("The triggers of same workflow by some node (create, update and sub-flow etc.) more than this number will be ignored. Large number may cause performance issues. Please use with caution.", { ns: "${NAMESPACE}" }) }}`,
        'x-decorator': 'FormItem',
        default: 1,
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 1,
          precision: 0,
          className: 'auto-width',
        },
      },
    },
  },
};

export const workflowSchema: ISchema = {
  name: 'workflow',
  type: 'void',
  properties: {
    provider: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection: workflowCollection,
        resourceName: 'workflows',
        request: {
          resource: 'workflows',
          action: 'list',
          params: {
            filter: {
              current: true,
            },
            sort: ['-createdAt'],
            except: ['config'],
          },
        },
      },
      'x-component': 'CategoryTabs',
      properties: {
        main: {
          type: 'void',
          'x-component': 'CardItem',
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
                filter: {
                  type: 'void',
                  title: '{{ t("Filter") }}',
                  default: {
                    $and: [{ title: { $includes: '' } }],
                  },
                  'x-action': 'filter',
                  'x-component': 'Filter.Action',
                  'x-use-component-props': 'useWorkflowFilterActionProps',
                  'x-component-props': {
                    icon: 'FilterOutlined',
                    nonfilterable: ['description', 'categories'],
                  },
                  'x-align': 'left',
                },
                refresher: {
                  type: 'void',
                  title: '{{ t("Refresh") }}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useRefreshActionProps',
                  'x-component-props': {
                    icon: 'ReloadOutlined',
                  },
                },
                sync: {
                  type: 'void',
                  title: `{{t("Sync", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'Tooltip',
                  'x-decorator-props': {
                    title: `{{ t("Sync enabled status of all workflows from database", { ns: "${NAMESPACE}" }) }}`,
                  },
                  'x-component': 'Action',
                  'x-component-props': {
                    icon: 'SyncOutlined',
                    useAction: '{{ useSyncAction }}',
                  },
                  'x-reactions': ['{{useWorkflowSyncReaction}}'],
                },
                delete: {
                  type: 'void',
                  title: '{{t("Delete")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    icon: 'DeleteOutlined',
                    useAction: '{{ cm.useBulkDestroyAction }}',
                    confirm: {
                      title: "{{t('Delete record')}}",
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
                        initialValue: {
                          current: true,
                        },
                      },
                      title: '{{t("Add new")}}',
                      properties: {
                        title: workflowFieldset.title,
                        type: workflowFieldset.type,
                        sync: workflowFieldset.sync,
                        categories: workflowFieldset.categories,
                        description: workflowFieldset.description,
                        options: workflowFieldset.options,
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            cancel: {
                              title: '{{ t("Cancel") }}',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            submit: {
                              title: '{{ t("Submit") }}',
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
              type: 'array',
              'x-component': 'Table.Void',
              'x-component-props': {
                rowKey: 'id',
                rowSelection: {
                  type: 'checkbox',
                },
                useDataSource: '{{cm.useDataSourceFromRAC }}',
              },
              properties: {
                title: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Title") }}`,
                  properties: {
                    title: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                categories: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Category", { ns: "${NAMESPACE}" }) }}`,
                  properties: {
                    categories: {
                      type: 'array',
                      'x-component': 'EnumerationField',
                      'x-component-props': {
                        multiple: true,
                        fieldNames: {
                          label: 'title',
                          value: 'id',
                          color: 'color',
                        },
                      },
                      // 'x-collection-field': 'workflows.categories',
                      // 'x-read-pretty': true,
                      // 'x-component-props': {
                      //   mode: 'Tag',
                      // },
                    },
                  },
                },
                type: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Trigger type", { ns: "${NAMESPACE}" }) }}`,
                  properties: {
                    type: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                sync: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Execute mode", { ns: "${NAMESPACE}" }) }}`,
                  properties: {
                    sync: {
                      type: 'boolean',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                enabled: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Status", { ns: "${NAMESPACE}" }) }}`,
                  properties: {
                    enabled: {
                      type: 'boolean',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                      default: false,
                    },
                  },
                },
                'stats.executed': {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  title: `{{ t("Executed", { ns: "${NAMESPACE}" }) }}`,
                  properties: {
                    'stats.executed': {
                      type: 'number',
                      'x-decorator': 'OpenDrawer',
                      'x-decorator-props': {
                        component: ExecutedLink,
                      },
                      'x-component': 'InputNumber',
                      'x-read-pretty': true,
                      properties: {
                        drawer: executionSchema,
                      },
                    },
                  },
                },
                actions: {
                  type: 'void',
                  title: '{{ t("Actions") }}',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  properties: {
                    actions: {
                      type: 'void',
                      'x-component': 'Space',
                      'x-component-props': {
                        split: '|',
                      },
                      properties: {
                        configure: {
                          type: 'void',
                          'x-component': 'WorkflowLink',
                        },
                        update: {
                          type: 'void',
                          title: '{{ t("Edit") }}',
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
                              title: '{{ t("Edit") }}',
                              properties: {
                                title: workflowFieldset.title,
                                enabled: workflowFieldset.enabled,
                                sync: workflowFieldset.sync,
                                categories: workflowFieldset.categories,
                                description: workflowFieldset.description,
                                options: workflowFieldset.options,
                                footer: {
                                  type: 'void',
                                  'x-component': 'Action.Drawer.Footer',
                                  properties: {
                                    cancel: {
                                      title: '{{ t("Cancel") }}',
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        useAction: '{{ cm.useCancelAction }}',
                                      },
                                    },
                                    submit: {
                                      title: '{{ t("Submit") }}',
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
                        revision: {
                          type: 'void',
                          title: `{{t("Duplicate", { ns: "${NAMESPACE}" })}}`,
                          'x-component': 'Action.Link',
                          'x-component-props': {
                            openSize: 'small',
                          },
                          properties: {
                            modal: {
                              type: 'void',
                              title: `{{t("Duplicate to new workflow", { ns: "${NAMESPACE}" })}}`,
                              'x-decorator': 'FormV2',
                              'x-component': 'Action.Modal',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: '{{t("Title")}}',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                footer: {
                                  type: 'void',
                                  'x-component': 'Action.Modal.Footer',
                                  properties: {
                                    submit: {
                                      type: 'void',
                                      title: '{{t("Submit")}}',
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        type: 'primary',
                                        useAction: '{{ useRevisionAction }}',
                                      },
                                    },
                                    cancel: {
                                      type: 'void',
                                      title: '{{t("Cancel")}}',
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        useAction: '{{ cm.useCancelAction }}',
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
                            useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
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
  },
};
