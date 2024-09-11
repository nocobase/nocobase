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

export const createGanttBlockUISchema = (options: {
  fieldNames: object;
  dataSource: string;
  association?: string;
  collectionName?: string;
}): ISchema => {
  const { collectionName, fieldNames, dataSource, association } = options;

  const schema = {
    type: 'void',
    'x-acl-action': `${association || collectionName}:list`,
    'x-decorator': 'GanttBlockProvider',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      action: 'list',
      fieldNames,
      params: {
        paginate: false,
      },
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:gantt',
    // 'x-designer': 'Gantt.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Gantt',
        'x-use-component-props': 'useGanttBlockProps',
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'gantt:configureActions',
            properties: {},
          },
          table: {
            type: 'array',
            'x-decorator': 'div',
            'x-decorator-props': {
              style: {
                float: 'left',
                maxWidth: '35%',
              },
            },

            'x-initializer': 'table:configureColumns',
            'x-component': 'TableV2',
            'x-use-component-props': 'useTableBlockProps',
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
              pagination: false,
            },
            properties: {
              actions: {
                type: 'void',
                title: '{{ t("Actions") }}',
                'x-action-column': 'actions',
                'x-decorator': 'TableV2.Column.ActionBar',
                'x-component': 'TableV2.Column',
                'x-toolbar': 'TableColumnSchemaToolbar',
                'x-initializer': 'table:configureItemActions',
                'x-settings': 'fieldSettings:TableColumn',
                'x-toolbar-props': {
                  initializer: 'table:configureItemActions',
                },
                properties: {
                  actions: {
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
          detail: {
            type: 'void',
            'x-component': 'Gantt.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: '{{ t("View record") }}',
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'popup:addTab',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'popup:common:addBlock',
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

  if (association) {
    schema['x-decorator-props']['association'] = association;
  }
  return schema;
};
