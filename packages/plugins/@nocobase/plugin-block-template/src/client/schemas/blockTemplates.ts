/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { blockTemplatesCollection } from '../collections/blockTemplates';
import { createActionSchema } from './createActionSchema';
import { ConfigureLink } from '../components/ConfigureLink';
import { editActionSchema } from './editActionSchema';
import { NAMESPACE } from '../constants';
import { tStr } from '../locale';
import { bulkDestroySchema } from './bulkDestroySchema';
import { AddNewTemplate } from '../components/AddNewTemplate';

export const blockTemplatesSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: blockTemplatesCollection.name,
    action: 'list',
    params: {
      sort: '-createdAt',
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
        addNew: {
          type: 'void',
          'x-component': AddNewTemplate,
        },
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: blockTemplatesCollection.filterTargetKey,
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        title: {
          type: 'void',
          title: '{{ t("Title") }}',
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
          title: '{{ t("Name") }}',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 80,
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
        type: {
          type: 'void',
          title: tStr('Type'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 80,
          },
          properties: {
            type: {
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
          title: '{{ t("Description") }}',
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
        actions: {
          type: 'void',
          title: '{{ t("Actions") }}',
          'x-component': 'TableV2.Column',
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
                  title: `{{t("Duplicate", { ns: "${NAMESPACE}" })}}`,
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openSize: 'small',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: `{{t("Duplicate to new template", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormV2',
                      'x-component': 'Action.Modal',
                      properties: {
                        title: {
                          type: 'string',
                          title: '{{t("Title")}}',
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
                                useAction: '{{ useDuplicateAction }}',
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
                  title: tStr('Delete'),
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openSize: 'small',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: `{{t("Delete", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormV2',
                      'x-component': 'Action.Modal',
                      'x-component-props': {
                        openSize: 'small',
                      },
                      properties: {
                        keepBlocks: {
                          type: 'boolean',
                          'x-decorator': 'FormItem',
                          'x-component': 'Checkbox',
                          default: true,
                          'x-content': tStr('Keep the created blocks?'),
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
                                useAction: '{{ useDeleteAction }}',
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
  },
};
