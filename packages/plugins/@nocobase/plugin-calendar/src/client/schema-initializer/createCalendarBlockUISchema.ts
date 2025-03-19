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
import { generateNTemplate } from '../../locale';

export const createCalendarBlockUISchema = (options: {
  dataSource: string;
  fieldNames: object;
  collectionName?: string;
  association?: string;
}): ISchema => {
  const { collectionName, dataSource, fieldNames, association } = options;

  return {
    type: 'void',
    'x-acl-action': `${association || collectionName}:list`,
    'x-decorator': 'CalendarBlockProvider',
    'x-use-decorator-props': 'useCalendarBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      association,
      action: 'list',
      fieldNames: {
        id: 'id',
        ...fieldNames,
      },
      params: {
        paginate: false,
      },
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:calendar',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'CalendarV2',
        'x-use-component-props': 'useCalendarBlockProps',
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'CalendarV2.ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'calendar:configureActions',
          },
          event: {
            type: 'void',
            'x-component': 'CalendarV2.Event',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: generateNTemplate('View record'),
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'popup:addTab',
                    'x-initializer-props': {
                      gridInitializer: 'popup:common:addBlock',
                    },
                    properties: {
                      tab1: {
                        type: 'void',
                        title: generateNTemplate('Details'),
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer-props': {
                              actionInitializers: 'details:configureActions',
                            },
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
};
