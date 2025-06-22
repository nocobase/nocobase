/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { ISchema } from '@nocobase/client';
import { uid } from '@formily/shared';
import { lightComponentsCollection } from '../collections/lightComponents';
import { createActionSchema } from './createActionSchema';
import { editActionSchema } from './editActionSchema';
import { bulkDestroySchema } from './bulkDestroySchema';
import { ConfigureLink } from '../components/ConfigureLink';
import { tStr, NAMESPACE } from '../locale';

export const lightComponentsSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: lightComponentsCollection.name,
    action: 'list',
    params: {
      sort: ['-updatedAt'],
    },
    showIndex: true,
    dragSort: false,
    rowKey: 'key',
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
          type: 'void',
          title: '{{ t("Filter") }}',
          default: {
            $and: [{ title: { $includes: '' } }],
          },
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
        refresh: {
          type: 'void',
          title: '{{ t("Refresh") }}',
          'x-component': 'Action',
          'x-use-component-props': 'useRefreshActionProps',
          'x-component-props': {
            icon: 'ReloadOutlined',
          },
        },
        bulkDestroySchema,
        addNew: createActionSchema,
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: lightComponentsCollection.filterTargetKey,
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        title: {
          type: 'void',
          title: tStr('Title'),
          'x-component': 'TableV2.Column',
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
        key: {
          type: 'void',
          title: tStr('Key'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 120,
          },
          properties: {
            key: {
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
          title: tStr('Description'),
          'x-component': 'TableV2.Column',
          properties: {
            description: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        updatedAt: {
          type: 'void',
          title: tStr('Updated At'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 160,
          },
          properties: {
            updatedAt: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        actions: {
          type: 'void',
          title: tStr('Actions'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 200,
          },
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
                  title: tStr('Configure'),
                  'x-component': ConfigureLink,
                },
                editActionSchema,
                duplicate: {
                  type: 'void',
                  title: tStr('Copy'),
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openSize: 'small',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: `{{t("Duplicate to new component", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormV2',
                      'x-component': 'Action.Modal',
                      properties: {
                        title: {
                          type: 'string',
                          title: tStr('Title'),
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                          required: true,
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Modal.Footer',
                          properties: {
                            cancel: {
                              type: 'void',
                              title: '{{t("Cancel")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            submit: {
                              type: 'void',
                              title: '{{t("Submit")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                              },
                              'x-use-component-props': 'useDuplicateAction',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                delete: {
                  type: 'void',
                  title: tStr('Delete'),
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openSize: 'small',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: tStr('Delete Light Component'),
                      'x-component': 'Action.Modal',
                      'x-component-props': {
                        openSize: 'small',
                      },
                      properties: {
                        content: {
                          type: 'void',
                          'x-component': 'div',
                          'x-content': tStr(
                            'Are you sure to delete this light component? This action cannot be undone.',
                          ),
                          'x-component-props': {
                            style: {
                              marginBottom: 16,
                            },
                          },
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Modal.Footer',
                          properties: {
                            cancel: {
                              type: 'void',
                              title: '{{t("Cancel")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            submit: {
                              type: 'void',
                              title: '{{t("Delete")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                danger: true,
                              },
                              'x-use-component-props': 'useDeleteAction',
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
  },
};
