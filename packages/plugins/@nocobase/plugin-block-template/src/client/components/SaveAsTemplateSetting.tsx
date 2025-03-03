/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, SchemaSettingsModalItem } from '@nocobase/client';
import React from 'react';
import { useT } from '../locale';
import { useFieldSchema } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App } from 'antd';

const blockDecoratorMenuMaps = {
  TableBlockProvider: ['Table', 'table'],
  FormBlockProvider: ['Form', 'form'],
  DetailsBlockProvider: ['Details', 'details'],
  'List.Decorator': ['List', 'list'],
  'GridCard.Decorator': ['GridCard', 'gridCard'],
  CalendarBlockProvider: ['Calendar', 'calendar'],
  GanttBlockProvider: ['Gantt', 'gantt'],
  KanbanBlockProvider: ['Kanban', 'kanban'],
  FilterFormBlockProvider: ['FilterFormItem', 'filterForm'],
  'AssociationFilter.Provider': ['FilterCollapse', 'filterCollapse'],
};

export const SaveAsTemplateSetting = () => {
  const t = useT();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const blockId = uid();
  const { message } = App.useApp();

  return (
    <SchemaSettingsModalItem
      title={t('Save as template')}
      schema={
        {
          type: 'object',
          title: t('Save as template'),
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: t('Title'),
              required: true,
              'x-component': 'Input',
            },
            key: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: t('Key'),
              'x-component': 'Input',
              'x-validator': 'uid',
              required: true,
              'x-value': `t_${uid()}`,
              description:
                "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
            },
            description: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: t('Description'),
              'x-component': 'Input.TextArea',
            },
          },
        } as ISchema
      }
      onSubmit={async ({ title, key, description }) => {
        // step 0: get type of the current block
        const type = window.location.pathname.startsWith('/m/') ? 'Mobile' : 'Desktop';
        const schemaUid = uid();
        const isMobile = type === 'Mobile';
        const schema = {
          type: 'void',
          name: key,
          'x-uid': `template-${schemaUid}`,
          _isJSONSchemaObject: true,
          properties: {
            template: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'div',
              ...(isMobile
                ? {
                    'x-component-props': {
                      style: {
                        padding: '10px',
                        maxHeight: '100%',
                        overflow: 'scroll',
                      },
                    },
                  }
                : {}),
              properties: {
                blocks: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-decorator': 'TemplateGridDecorator',
                  'x-component': 'Grid',
                  'x-initializer': isMobile ? 'mobile:addBlock' : 'page:addBlock',
                  'x-uid': blockId,
                  'x-async': false,
                  'x-index': 1,
                  properties: {},
                },
              },
              'x-uid': schemaUid,
              'x-async': true,
              'x-index': 1,
            },
          },
        };
        const menuInfo = blockDecoratorMenuMaps[fieldSchema['x-decorator']];
        await api.resource('blockTemplates').create({
          values: {
            title,
            key,
            description,
            uid: schemaUid,
            configured: true,
            collection: fieldSchema['x-decorator-props']?.collection,
            dataSource: fieldSchema['x-decorator-props']?.dataSource,
            componentType: menuInfo[0],
            menu: menuInfo[1],
          },
        });
        await api.resource('uiSchemas').insert({ values: schema });
        await api.request({
          url: `/uiSchemas:insertAdjacent/${blockId}?position=beforeEnd`,
          method: 'POST',
          data: {
            schema: fieldSchema.toJSON(),
            wrap: {
              name: uid(),
              type: 'void',
              'x-component': 'Grid.Row',
              'x-index': 1,
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-index': 1,
                },
              },
            },
          },
        });
        message.success(t('Save as template successfully'));
      }}
    />
  );
};
