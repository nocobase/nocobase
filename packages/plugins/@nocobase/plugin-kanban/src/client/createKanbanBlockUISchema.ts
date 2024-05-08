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

export const createKanbanBlockUISchema = (options: {
  groupField: string;
  sortField: string;
  dataSource: string;
  params?: Record<string, any>;
  collectionName?: string;
  association?: string;
}): ISchema => {
  const { collectionName, groupField, sortField, dataSource, params, association } = options;

  const schema = {
    type: 'void',
    'x-acl-action': `${association || collectionName}:list`,
    'x-decorator': 'KanbanBlockProvider',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      action: 'list',
      groupField,
      sortField,
      params: {
        paginate: false,
        ...params,
      },
    },
    // 'x-designer': 'Kanban.Designer',
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:kanban',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'kanban:configureActions',
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
        'x-component': 'Kanban',
        'x-use-component-props': 'useKanbanBlockProps',
        properties: {
          card: {
            type: 'void',
            'x-read-pretty': true,
            'x-label-disabled': true,
            'x-decorator': 'BlockItem',
            'x-component': 'Kanban.Card',
            'x-component-props': {
              openMode: 'drawer',
            },
            'x-designer': 'Kanban.Card.Designer',
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-component-props': { dndContext: false },
              },
            },
          },
          cardViewer: {
            type: 'void',
            title: '{{ t("View") }}',
            'x-designer': 'Action.Designer',
            'x-component': 'Kanban.CardViewer',
            'x-action': 'view',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("View record") }}',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
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
                            properties: {},
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
