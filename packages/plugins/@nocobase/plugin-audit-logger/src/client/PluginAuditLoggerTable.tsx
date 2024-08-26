/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ExtendCollectionsProvider, SchemaComponent, useFilterActionProps, useFormBlockProps } from '@nocobase/client';
import { ISchema } from '@nocobase/client';

const auditLogCollection = {
  name: 'auditTrails',
  filterTargetKey: 'id',
  fields: [
    {
      type: 'string',
      name: 'action',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Actions") }}',
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'uuid',
      name: 'uuid',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("UUID") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'resource',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("Resource") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'collection',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("collection") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'association',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("association") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'resourceUk',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("resourceUk") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    // {
    //   type: 'string',
    //   name: 'resourceUk',
    //   interface: 'richText',
    //   uiSchema: {
    //     title: '{{ t("resourceUk") }}',
    //     required: true,
    //     'x-component': 'RichText',
    //   },
    // },
    {
      type: 'array',
      name: 'action',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("action") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'resourceId',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("resourceId") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'userId',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("userId") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'belongsTo',
      name: 'user',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("user") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'role',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("role") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'ip',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("ip") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'ua',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("ua") }}',
        required: true,
        'x-component': 'RichText',
        'x-read-pretty': true,
      },
    },
    {
      type: 'json',
      name: 'metadata',
      interface: 'richText',
      uiSchema: {
        title: '{{ t("metadata") }}',
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'createdAt',
      interface: 'createdAt',
      uiSchema: {
        title: '{{ t("Created at") }}',
        required: true,
        'x-component': 'RichText',
        'x-read-pretty': true,
      },
    },
  ],
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: auditLogCollection.name,
        action: 'list',
        params: {
          pageSize: 10,
        },
        showIndex: true,
        dragSort: false,
      },
      properties: {
        // 添加按钮
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
              title: '{{ t("Filter") }}',
              'x-component': 'Filter.Action',
              'x-use-component-props': 'useFilterActionProps',
              'x-component-props': {
                icon: 'FilterOutlined',
              },
              'x-align': 'left',
            },
            export: {
              title: '{{ t("Export") }}',
              'x-action': 'export',
              'x-action-settings': {
                exportSettings: [
                  {
                    dataIndex: ['action'],
                  },
                  {
                    dataIndex: ['uuid'],
                  },
                  {
                    dataIndex: ['resource'],
                  },
                  {
                    dataIndex: ['collection'],
                  },
                  {
                    dataIndex: ['association'],
                  },
                  {
                    dataIndex: ['resouceUk'],
                  },
                  {
                    dataIndex: ['resourceId'],
                  },
                  {
                    dataIndex: ['userId'],
                  },
                  {
                    dataIndex: ['user'],
                  },
                  {
                    dataIndex: ['ip'],
                  },
                  {
                    dataIndex: ['ua'],
                  },
                  {
                    dataIndex: ['metadata'],
                  },
                  {
                    dataIndex: ['createdAt'],
                  },
                ],
              },
              'x-component-props': {
                icon: 'clouddownloadoutlined',
                useProps: '{{ useExportAction }}',
              },
              'x-component': 'Action',
              'x-align': 'right',
            },
            refresh: {
              title: 'Refresh',
              'x-component': 'Action',
              'x-align': 'right',
              'x-use-component-props': 'useRefreshActionProps',
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
            action: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-component': 'TableV2.Column',
              properties: {
                action: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            uuid: {
              type: 'void',
              title: '{{ t("UUID") }}',
              'x-component': 'TableV2.Column',
              properties: {
                uuid: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            resource: {
              type: 'void',
              title: '{{ t("resource") }}',
              'x-component': 'TableV2.Column',
              properties: {
                resource: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            collection: {
              type: 'void',
              title: '{{ t("collection") }}',
              'x-component': 'TableV2.Column',
              properties: {
                collection: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            association: {
              type: 'void',
              title: '{{ t("association") }}',
              'x-component': 'TableV2.Column',
              properties: {
                association: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            resourceUk: {
              type: 'void',
              title: '{{ t("resourceUk") }}',
              'x-component': 'TableV2.Column',
              properties: {
                resourceUk: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            resourceId: {
              type: 'void',
              title: '{{ t("resourceId") }}',
              'x-component': 'TableV2.Column',
              properties: {
                resourceId: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            userId: {
              type: 'void',
              title: '{{ t("userId") }}',
              'x-component': 'TableV2.Column',
              properties: {
                userId: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            user: {
              type: 'void',
              title: '{{ t("user") }}',
              'x-component': 'TableV2.Column',
              properties: {
                user: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            ip: {
              type: 'void',
              title: '{{ t("IP") }}',
              'x-component': 'TableV2.Column',
              properties: {
                ip: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            ua: {
              type: 'void',
              title: '{{ t("UA") }}',
              'x-component': 'TableV2.Column',
              properties: {
                ua: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            metadata: {
              type: 'void',
              title: '{{ t("metadata") }}',
              'x-component': 'TableV2.Column',
              properties: {
                metadata: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            createdAt: {
              type: 'void',
              title: '{{ t("Created at") }}',
              'x-component': 'TableV2.Column',
              properties: {
                createdAt: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const PluginAuditLoggerTable = () => {
  return (
    <ExtendCollectionsProvider collections={[auditLogCollection]}>
      <SchemaComponent schema={schema} scope={{ useFormBlockProps, useFilterActionProps }} />
    </ExtendCollectionsProvider>
  );
};
