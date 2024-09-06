/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useActionContext, useRequest } from '@nocobase/client';
import { useContext } from 'react';
import collection from '../../../../collections/channel';
import { COLLECTION_NAME } from '../../../../constant';
import { formProperties, updateFormProperties } from './form';
import { NotificationTypeNameContext } from '../context';

export const createFormSchema: ISchema = {
  type: 'object',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useCreateFormProps',
      title: '{{t("Add new")}}',
      properties: {
        ...formProperties,
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-use-component-props': 'useCloseActionProps',
            },
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-use-component-props': 'useCreateActionProps',
            },
          },
        },
      },
    },
  },
};

export const channelsSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: COLLECTION_NAME.channels,
    action: 'list',
    dragSort: false,
    params: {
      sort: ['createdAt'],
      pageSize: 20,
    },
  },
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
        create: {
          type: 'void',
          title: '{{t("Add new")}}',
          'x-component': 'AddNew',
          'x-component-props': {
            type: 'primary',
          },
        },
        refresh: {
          title: "{{t('Refresh')}}",
          'x-action': 'refresh',
          'x-component': 'Action',
          'x-use-component-props': 'useRefreshActionProps',
          'x-component-props': {
            icon: 'ReloadOutlined',
          },
        },
        filter: {
          'x-action': 'filter',
          type: 'object',
          'x-component': 'Filter.Action',
          title: "{{t('Filter')}}",
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'name',
      },
      properties: {
        name: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("ID")}}',
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        title: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Title")}}',
          properties: {
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        description: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Description")}}',
          properties: {
            description: {
              type: 'boolean',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        notificationType: {
          title: '{{t("Notification type")}}',
          type: 'void',
          'x-component': 'TableV2.Column',
          properties: {
            notificationType: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'TableV2.Column',
          properties: {
            edit: {
              type: 'void',
              title: 'Edit',
              'x-component': 'Action.Link',
              'x-component-props': {
                openMode: 'drawer',
                icon: 'EditOutlined',
              },
              properties: {
                drawer: {
                  type: 'void',
                  title: 'Edit',
                  'x-component': 'Action.Drawer',
                  properties: {
                    form: {
                      type: 'void',
                      'x-component': 'FormV2',
                      'x-use-component-props': 'useEditFormProps',
                      properties: {
                        ...updateFormProperties,
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            submit: {
                              title: 'Submit',
                              'x-component': 'Action',
                              'x-use-component-props': 'useEditActionProps',
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
              title: '{{t("Delete")}}',
              'x-component': 'Action.Link',
              'x-use-component-props': 'useDeleteActionProps',
            },
          },
        },
      },
    },
  },
};
