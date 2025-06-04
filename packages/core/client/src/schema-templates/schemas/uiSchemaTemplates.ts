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
import { useBlockRequestContext } from '../../block-provider';
import { useBulkDestroyActionProps, useDestroyActionProps, useUpdateActionProps } from '../../block-provider/hooks';
import { uiSchemaTemplatesCollection } from '../collections/uiSchemaTemplates';
import { useSchemaTemplateManager } from '../SchemaTemplateManagerProvider';
import { CollectionTitle } from './CollectionTitle';

const useUpdateSchemaTemplateActionProps = () => {
  const props = useUpdateActionProps();
  const { __parent } = useBlockRequestContext();
  return {
    async onClick() {
      await props.onClick();
      __parent?.service?.refresh?.();
    },
  };
};

const useBulkDestroyTemplateProps = () => {
  const props = useBulkDestroyActionProps();
  const bm = useSchemaTemplateManager();
  const { service } = useBlockRequestContext();

  return {
    async onClick() {
      await props.onClick();
      await bm.refresh();
      service?.refresh?.();
    },
  };
};

const useDestroyTemplateProps = () => {
  const props = useDestroyActionProps();
  const { service } = useBlockRequestContext();
  const bm = useSchemaTemplateManager();
  return {
    async onClick() {
      await props.onClick();
      await bm.refresh();
      service?.refresh?.();
    },
  };
};

export const uiSchemaTemplatesSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: uiSchemaTemplatesCollection,
        resource: 'uiSchemaTemplates',
        action: 'list',
        params: {
          pageSize: 20,
          // appends: ['collection'],
          sort: ['-createdAt'],
        },
        rowKey: 'key',
        showIndex: true,
        dragSort: false,
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
            destroy: {
              title: '{{ t("Delete") }}',
              'x-action': 'destroy',
              'x-component': 'Action',
              'x-use-component-props': useBulkDestroyTemplateProps,
              'x-component-props': {
                icon: 'DeleteOutlined',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
          },
        },
        [uid()]: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps',
          'x-component-props': {
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: '{{ t("Title") }}',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-collection-field': 'uiSchemaTemplates.name',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                  'x-component-props': {
                    ellipsis: true,
                  },
                },
              },
            },
            column2: {
              type: 'void',
              title: '{{t("Collection display name")}}',
              'x-component': 'TableV2.Column',
              properties: {
                'collection.title': {
                  type: 'string',
                  'x-component': CollectionTitle,
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
                  'x-decorator': 'DndContext',
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
                        refreshDataBlockRequest: false,
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Edit record") }}',
                          'x-component': 'Action.Container',
                          'x-component-props': {
                            className: 'nb-action-popup',
                          },
                          properties: {
                            form: {
                              type: 'void',
                              'x-decorator': 'FormBlockProvider',
                              'x-decorator-props': {
                                resource: 'uiSchemaTemplates',
                                collection: uiSchemaTemplatesCollection,
                                action: 'get',
                                useParams: '{{ useParamsFromRecord }}',
                              },
                              'x-component': 'CardItem',
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'FormV2',
                                  'x-use-component-props': 'useFormBlockProps',
                                  properties: {
                                    name: {
                                      type: 'string',
                                      'x-component': 'CollectionField',
                                      'x-decorator': 'FormItem',
                                      'x-collection-field': 'uiSchemaTemplates.name',
                                      required: true,
                                    },
                                    actions: {
                                      type: 'void',
                                      'x-component': 'ActionBar',
                                      'x-component-props': {
                                        layout: 'one-column',
                                        style: {
                                          marginTop: 24,
                                        },
                                      },
                                      properties: {
                                        submit: {
                                          title: '{{t("Submit")}}',
                                          'x-action': 'submit',
                                          'x-component': 'Action',
                                          'x-use-component-props': useUpdateSchemaTemplateActionProps,
                                          'x-component-props': {
                                            type: 'primary',
                                            htmlType: 'submit',
                                          },
                                          type: 'void',
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
                    destroy: {
                      title: '{{ t("Delete") }}',
                      'x-action': 'destroy',
                      'x-component': 'Action.Link',
                      'x-use-component-props': useDestroyTemplateProps,
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
