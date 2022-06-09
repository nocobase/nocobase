import { ISchema, observer, useField } from '@formily/react';
import { uid } from '@formily/shared';
import {
  CollectionManagerContext,
  CollectionManagerProvider,
  SchemaComponent,
  TableBlockProvider,
  useCompile
} from '@nocobase/client';
import React, { useContext } from 'react';
import { AuditLogsDesigner } from './AuditLogsDesigner';

export const createTableBlockSchema = (options) => {
  const { collection, resource, rowKey, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    name: uid(),
    'x-decorator': 'TableBlockProvider',
    'x-decorator-props': {
      collection,
      resource: resource || collection,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
      showIndex: true,
      dragSort: false,
      ...others,
    },
    'x-designer': 'TableBlockDesigner',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'TableActionInitializers',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': 'TableColumnInitializers',
        'x-component': 'TableV2',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useProps: '{{ useTableBlockProps }}',
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': 'TableActionColumnInitializers',
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
                properties: {},
              },
            },
          },
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};

const schema: ISchema = createTableBlockSchema({
  rowKey: 'id',
  collection: 'auditLogs',
});

const collection = {
  name: 'auditLogs',
  title: '{{t("Audit logs")}}',
  fields: [
    {
      name: 'createdAt',
      type: 'date',
      interface: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
        'x-read-pretty': true,
      },
    },
    {
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Audit type")}}',
        'x-component': 'Select',
        'x-read-pretty': true,
        enum: [
          { label: '添加操作', value: 'create' },
          { label: '更新操作', value: 'update' },
          { label: '删除操作', value: 'destroy' },
        ],
      },
    },
  ],
};

const Username = observer(() => {
  const field = useField<any>();
  return <div>{field?.value?.nickname || field.value?.id}</div>;
});

const Collection = observer(() => {
  const field = useField<any>();
  const { title, name } = field.value || {};
  const compile = useCompile();
  return <div>{title ? compile(title) : name}</div>;
});

export const AuditLogs: any = () => {
  return (
    <SchemaComponent
      memoized
      components={{ Username, Collection }}
      schema={{
        type: 'void',
        name: 'lfm4trkw8j3',
        'x-component': 'div',
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
                'x-action': 'filter',
                // 'x-designer': 'Filter.Action.Designer',
                'x-component': 'Filter.Action',
                'x-component-props': {
                  icon: 'FilterOutlined',
                  useProps: '{{ useFilterActionProps }}',
                },
                'x-align': 'left',
              },
            },
          },
          y84dlntcaup: {
            type: 'array',
            'x-component': 'TableV2',
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
              useProps: '{{ useTableBlockProps }}',
            },
            properties: {
              actions: {
                type: 'void',
                title: '{{ t("Actions") }}',
                'x-action-column': 'actions',
                'x-decorator': 'TableV2.Column.ActionBar',
                'x-component': 'TableV2.Column',
                'x-designer': 'TableV2.ActionColumnDesigner',
                'x-initializer': 'TableActionColumnInitializers',
                properties: {
                  actions: {
                    type: 'void',
                    'x-decorator': 'DndContext',
                    'x-component': 'Space',
                    'x-component-props': {
                      split: '|',
                    },
                    properties: {},
                  },
                },
              },
              column1: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                properties: {
                  createdAt: {
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              column2: {
                type: 'void',
                'x-decorator': 'TableV2.Column.Decorator',
                'x-component': 'TableV2.Column',
                properties: {
                  type: {
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              column3: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: '{{t("Collection display name")}}',
                properties: {
                  collection: {
                    'x-component': 'Collection',
                    'x-read-pretty': true,
                  },
                },
              },
              column4: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: '{{t("Username")}}',
                properties: {
                  user: {
                    'x-component': 'Username',
                    'x-read-pretty': true,
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

AuditLogs.Decorator = observer((props: any) => {
  const { interfaces } = useContext(CollectionManagerContext);
  const defaults = {
    collection: 'auditLogs',
    resource: 'auditLogs',
    action: 'list',
    params: {
      pageSize: 20,
      appends: ['collection', 'user'],
      ...props.params,
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };
  return (
    <CollectionManagerProvider collections={[collection]} interfaces={interfaces}>
      <TableBlockProvider {...defaults}>{props.children}</TableBlockProvider>
    </CollectionManagerProvider>
  );
});

AuditLogs.Designer = AuditLogsDesigner;
