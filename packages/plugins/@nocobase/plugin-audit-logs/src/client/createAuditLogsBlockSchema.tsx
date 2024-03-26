import { ISchema } from '@formily/react';
import { uid } from '@nocobase/utils/client';

export function createAuditLogsBlockSchema(): ISchema {
  return {
    type: 'void',
    'x-decorator': 'AuditLogsBlockProvider',
    'x-acl-action': `auditLogs:list`,
    'x-decorator-props': {
      collection: 'auditLogs',
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey: 'id',
      showIndex: true,
      dragSort: false,
      disableTemplate: true,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:table',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'auditLogsTable:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': 'auditLogsTable:configureColumns',
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
            'x-initializer': 'auditLogsTable:configureItemActions',
            properties: {
              [uid()]: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
              },
            },
          },
        },
      },
    },
  };
}
