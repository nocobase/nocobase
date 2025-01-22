/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { COLLECTION_NAME } from '../../../../constant';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { formProperties } from './form';
import { MessageScopeNames, MessageComponentNames } from '../types';
export const messageManagerSchema: ISchema = {
  type: 'void',
  name: COLLECTION_NAME.messages,
  'x-decorator': 'TableBlockProvider',
  'x-acl-action': `${COLLECTION_NAME.messages}:list`,
  'x-use-decorator-props': 'useTableBlockDecoratorProps',
  'x-decorator-props': {
    collection: `${COLLECTION_NAME.messages}`,
    action: 'list',
    request: {
      resource: COLLECTION_NAME.messages,
      action: 'list',
      params: {
        pageSize: 20,
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
        create: {
          type: 'void',
          'x-uid': 'create',
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
              properties: {
                mwjr03qwm35: {
                  type: 'void',
                  'x-component': 'FormV2',
                  'x-use-component-props': 'useEditFormProps',
                  properties: {
                    ...formProperties,
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        submit: {
                          title: '{{t("Submit")}}',
                          'x-component': 'Action',
                          'x-action': 'submit',
                          'x-use-component-props': 'useSubmitActionProps',
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
    table: {
      type: 'array',
      'x-uid': 'table_messages',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        id: {
          type: 'void',
          'x-decorator': 'TableV2.Column.Decorator',
          'x-component': 'TableV2.Column',
          properties: {
            id: {
              type: 'number',
              'x-component': 'CollectionField',
              'x-collection-field': `${COLLECTION_NAME.messages}.id`,
              'x-read-pretty': true,
            },
          },
        },
        title: {
          type: 'void',
          'x-decorator': 'TableV2.Column.Decorator',
          'x-component': 'TableV2.Column',
          properties: {
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-collection-field': `${COLLECTION_NAME.messages}.title`,
              'x-read-pretty': true,
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'TableV2.Column',
          'x-action-column': 'actions',
          'x-decorator': 'TableV2.Column.ActionBar',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                send: {
                  type: 'void',
                  title: '{{ t("Send") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Send Message')}}",
                      content: "{{t('Are you sure you want to Send it?')}}",
                    },
                    useAction: `{{${MessageScopeNames.useSendAction}}}`,
                  },
                },

                logs: {
                  type: 'void',
                  title: '{{t("Logs")}}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
                  },
                  'x-action-context': {
                    dataSource: 'main',
                    collection: `${COLLECTION_NAME.messages}`,
                  },
                  'x-decorator': 'ACLActionProvider',
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      title: '{{t("Logs")}}',
                      properties: {
                        logs: {
                          type: 'void',
                          'x-component': `${MessageComponentNames.MessageLogManager}`,
                        },
                      },
                    },
                  },
                },
                update: {
                  type: 'void',
                  title: '{{t("Configure")}}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
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
                            ...formProperties,
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                submit: {
                                  title: '{{t("Submit")}}',
                                  'x-component': 'Action',
                                  'x-use-component-props': 'useSubmitActionProps',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                r82c1dijim3: {
                  title: '{{ t("Delete") }}',
                  'x-action': 'destroy',
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useDestroyActionProps',
                  'x-toolbar': 'ActionSchemaToolbar',
                  'x-settings': 'actionSettings:delete',
                  'x-component-props': {
                    icon: 'DeleteOutlined',
                    confirm: {
                      title: "{{t('Delete record')}}",
                      content: "{{t('Are you sure you want to delete it?')}}",
                    },
                    refreshDataBlockRequest: true,
                  },
                  'x-decorator': 'ACLActionProvider',
                  'x-designer-props': {
                    linkageAction: true,
                  },
                  type: 'void',
                  'x-uid': 'r82c1dijim3',
                  'x-async': false,
                  'x-index': 2,
                },
              },
            },
          },
        },
      },
    },
  },
};
