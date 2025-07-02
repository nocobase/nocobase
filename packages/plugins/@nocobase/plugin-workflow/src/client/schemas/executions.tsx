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
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';

import { useActionContext, useResourceActionContext, useResourceContext } from '@nocobase/client';
import executionCollection from '../../common/collections/executions';

import { ExecutionStatusOptions, EXECUTION_STATUS } from '../constants';
import { NAMESPACE } from '../locale';
import { getWorkflowDetailPath } from '../utils';

// export const executionCollection = {
//   name: 'executions',
//   fields: [
//     {
//       interface: 'id',
//       type: 'bigInt',
//       name: 'id',
//       uiSchema: {
//         type: 'number',
//         title: '{{t("ID")}}',
//         'x-component': 'Input',
//         'x-component-props': {},
//         'x-read-pretty': true,
//       } as ISchema,
//     },
//     {
//       interface: 'createdAt',
//       type: 'datetime',
//       name: 'createdAt',
//       uiSchema: {
//         type: 'datetime',
//         title: `{{t("Triggered at", { ns: "${NAMESPACE}" })}}`,
//         'x-component': 'DatePicker',
//         'x-component-props': {},
//         'x-read-pretty': true,
//       } as ISchema,
//     },
//     {
//       interface: 'm2o',
//       type: 'belongsTo',
//       name: 'workflowId',
//       uiSchema: {
//         type: 'number',
//         title: `{{t("Version", { ns: "${NAMESPACE}" })}}`,
//         ['x-component']({ value }) {
//           const { setVisible } = useActionContext();
//           return <Link to={getWorkflowDetailPath(value)} onClick={() => setVisible(false)}>{`#${value}`}</Link>;
//         },
//       } as ISchema,
//     },
//     {
//       type: 'number',
//       name: 'status', as ISchema,
//     },
//   ],
// };

export const executionSchema = {
  type: 'void',
  name: 'executionHistoryDrawer',
  title: `{{t("Execution history", { ns: "${NAMESPACE}" })}}`,
  'x-component': 'Action.Drawer',
  properties: {
    content: {
      type: 'void',
      'x-decorator': 'ExecutionResourceProvider',
      'x-decorator-props': {
        collection: executionCollection,
        resourceName: 'executions',
        request: {
          resource: 'executions',
          action: 'list',
          params: {
            appends: ['workflow.id', 'workflow.title'],
            pageSize: 20,
            sort: ['-createdAt'],
            except: ['context', 'output'],
            filter: {},
          },
        },
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
            refresher: {
              type: 'void',
              title: '{{ t("Refresh") }}',
              'x-component': 'Action',
              'x-use-component-props': 'useRefreshActionProps',
              'x-component-props': {
                icon: 'ReloadOutlined',
              },
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
            clear: {
              type: 'void',
              title: '{{t("Clear")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction() {
                  const { t } = useTranslation();
                  const { refresh, defaultRequest } = useResourceActionContext();
                  const { resource } = useResourceContext();
                  const { setVisible } = useActionContext();
                  return {
                    async run() {
                      await resource.destroy({ filter: defaultRequest.params?.filter });
                      message.success(t('Operation succeeded'));
                      refresh();
                      setVisible(false);
                    },
                  };
                },
                confirm: {
                  title: `{{t("Clear all executions", { ns: "${NAMESPACE}" })}}`,
                  content: `{{t("Clear executions will not reset executed count, and started executions will not be deleted, are you sure you want to delete them all?", { ns: "${NAMESPACE}" })}}`,
                },
              },
            },
          },
        },
        table: {
          type: 'void',
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
                  type: 'number',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            createdAt: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                createdAt: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-component-props': {
                    showTime: true,
                  },
                  'x-read-pretty': true,
                },
              },
            },
            workflowId: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              title: `{{t("Version", { ns: "${NAMESPACE}" })}}`,
              properties: {
                workflowId: {
                  type: 'number',
                  ['x-component']({ value }) {
                    const { setVisible } = useActionContext();
                    return (
                      <Link to={getWorkflowDetailPath(value)} onClick={() => setVisible(false)}>{`#${value}`}</Link>
                    );
                  },
                  'x-read-pretty': true,
                },
              },
            },
            status: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
              properties: {
                status: {
                  type: 'number',
                  'x-decorator': 'ExecutionStatusColumn',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            actions: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-component': 'Table.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    link: {
                      type: 'void',
                      'x-component': 'ExecutionLink',
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
                      'x-reactions': [
                        {
                          dependencies: ['..status'],
                          fulfill: {
                            state: {
                              visible: `{{ $deps[0] !== ${EXECUTION_STATUS.STARTED} }}`,
                            },
                          },
                        },
                      ],
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
