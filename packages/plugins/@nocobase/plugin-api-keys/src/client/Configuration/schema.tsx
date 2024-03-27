import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useActionContext, useBlockRequestContext, useRecord } from '@nocobase/client';
import { Alert, Modal, Space, Typography } from 'antd';
import React from 'react';
import { generateNTemplate } from '../../locale';
import apiKeysCollection from '../../collections/apiKeys';
import { useTranslation } from '../locale';
const { useModal } = Modal;

const useCreateAction = () => {
  const form = useForm();
  const { setVisible } = useActionContext();
  const { resource, service } = useBlockRequestContext();
  const { t } = useTranslation();
  const [modalIns, element] = useModal();
  return {
    async run() {
      await form.submit();
      const response = await resource.create({
        values: form.values,
      });

      modalIns.success({
        title: t('API key created successfully'),
        onOk: () => {
          form.reset();
          setVisible(false);
        },
        content: (
          <Space direction="vertical">
            <Alert
              message={t('Make sure to copy your personal access key now as you will not be able to see this again.')}
              type="warning"
            ></Alert>
            <Typography.Text copyable>{response.data?.data?.token}</Typography.Text>
          </Space>
        ),
      });
      service?.refresh();
    },
    element,
  };
};

const useDestroyAction = () => {
  const record = useRecord();
  const { resource, service } = useBlockRequestContext();
  return {
    async run() {
      await resource.destroy({
        filterByTk: record.id,
      });
      service.refresh();
    },
  };
};

export const configurationSchema: ISchema = {
  type: 'object',
  properties: {
    configuration: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: apiKeysCollection,
        resource: 'apiKeys',
        action: 'list',
        params: {
          pageSize: 20,
          appends: ['role'],
          sort: ['-createdAt'],
        },
        rowKey: 'name',
        showIndex: true,
      },
      'x-component': 'CardItem',
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            style: {
              marginBottom: 'var(--nb-spacing)',
            },
          },
          properties: {
            create: {
              type: 'void',
              'x-action': 'create',
              title: generateNTemplate('Add API key'),
              'x-component': 'Action',
              'x-component-props': {
                icon: 'PlusOutlined',
                openMode: 'drawer',
                type: 'primary',
              },
              properties: {
                drawer: {
                  type: 'void',
                  title: generateNTemplate('Add API key'),
                  'x-decorator': 'Form',
                  'x-component': 'Action.Modal',
                  'x-component-props': {
                    maskClosable: false,
                    style: {
                      maxWidth: '520px',
                      width: '100%',
                    },
                  },
                  properties: {
                    name: {
                      type: 'string',
                      title: generateNTemplate('Key name'),
                      required: true,
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    role: {
                      type: 'string',
                      title: generateNTemplate('Role'),
                      required: true,
                      'x-decorator-props': {
                        tooltip: generateNTemplate('Allow only your own roles to be selected'),
                      },
                      'x-collection-field': 'apiKeys.role',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    expiresIn: {
                      type: 'string',
                      title: generateNTemplate('Expiration'),
                      required: true,
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      default: '30d',
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Modal.Footer',
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
                            useAction: useCreateAction,
                          },
                        },
                      },
                    },
                  },
                },
              },
              'x-align': 'right',
            },
          },
        },
        [uid()]: {
          type: 'array',
          'x-component': 'TableV2',
          'x-component-props': {
            rowKey: 'id',
            useProps: '{{ useTableBlockProps }}',
          },
          properties: {
            column1: {
              type: 'void',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-component': 'TableV2.Column',
              title: generateNTemplate('Key name'),
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-component': 'TableV2.Column',
              title: generateNTemplate('Role'),
              properties: {
                role: {
                  type: 'object',
                  'x-collection-field': 'apiKeys.role',
                  'x-component': 'CollectionField',
                  'x-component-props': {
                    enableLink: false,
                  },
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-component': 'TableV2.Column',
              title: generateNTemplate('Expiration'),
              properties: {
                expiresIn: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-component': 'TableV2.Column',
              title: generateNTemplate('Created at'),
              properties: {
                createdAt: {
                  type: 'date',
                  // 'x-component': 'CollectionField',
                  'x-component': 'DatePicker',
                  'x-component-props': {
                    format: 'YYYY-MM-DD HH:mm:ss',
                  },
                  'x-read-pretty': true,
                },
              },
            },
            actionColumn: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-action-column': 'actions',
              'x-decorator': 'TableV2.Column.ActionBar',
              'x-component': 'TableV2.Column',
              properties: {
                columnActions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: generateNTemplate('Delete API key'),
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: useDestroyAction,
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
