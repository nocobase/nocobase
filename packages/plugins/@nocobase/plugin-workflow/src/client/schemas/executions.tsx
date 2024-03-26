import React from 'react';
import { ISchema } from '@formily/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';

import { useActionContext, useRecord, useResourceActionContext, useResourceContext } from '@nocobase/client';

import { ExecutionStatusOptions } from '../constants';
import { NAMESPACE } from '../locale';
import { getWorkflowDetailPath } from '../utils';

export const executionCollection = {
  name: 'execution-executions',
  fields: [
    {
      interface: 'id',
      type: 'bigInt',
      name: 'id',
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'Input',
        'x-component-props': {},
        'x-read-pretty': true,
      } as ISchema,
    },
    {
      interface: 'createdAt',
      type: 'datetime',
      name: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: `{{t("Triggered at", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      } as ISchema,
    },
    {
      interface: 'm2o',
      type: 'belongsTo',
      name: 'workflowId',
      uiSchema: {
        type: 'number',
        title: `{{t("Version", { ns: "${NAMESPACE}" })}}`,
        ['x-component']({ value }) {
          const { setVisible } = useActionContext();
          return <Link to={getWorkflowDetailPath(value)} onClick={() => setVisible(false)}>{`#${value}`}</Link>;
        },
      } as ISchema,
    },
    {
      type: 'number',
      name: 'status',
      interface: 'select',
      uiSchema: {
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ExecutionStatusOptions,
      } as ISchema,
    },
  ],
};

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
                  type: 'datetime',
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
              properties: {
                workflowId: {
                  type: 'number',
                  'x-component': 'CollectionField',
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
