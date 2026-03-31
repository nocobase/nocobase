/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ISchema,
  SchemaSettingsModalItem,
  useResource,
  useSchemaSettings,
  useSchemaTemplateManager,
} from '@nocobase/client';
import React from 'react';
import { useT } from '../locale';
import { useFieldSchema, useField, useForm } from '@formily/react';
import { useAPIClient, usePlugin, useDesignable } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App } from 'antd';
import { PluginBlockTemplateClient } from '../index';
import { blockKeepProps } from '../initializers/TemplateBlockInitializer';
import _ from 'lodash';
import { addToolbarClass, syncExtraTemplateInfo } from '../utils/template';
import { useBlockTemplateMenus } from './BlockTemplateMenusProvider';
import { useLocation } from 'react-router-dom';

const blockDecoratorMenuMaps = {
  TableBlockProvider: ['Table', 'table'],
  FormBlockProvider: ['FormItem', 'form'],
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
  const field = useField();
  const { refresh } = useDesignable();
  const form = useForm();
  const api = useAPIClient();
  const blockTemplatesResource = useResource('blockTemplates');
  const blockId = uid();
  const { message } = App.useApp();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const { templates } = useBlockTemplateMenus();
  const location = useLocation();
  const { template: deprecatedTemplate } = useSchemaSettings();
  const schemaTemplateManager = useSchemaTemplateManager();

  return (
    <SchemaSettingsModalItem
      title={t('Save as inherited template')}
      schema={
        {
          type: 'object',
          title: t('Save as inherited template'),
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
              title: t('Name'),
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
        const type = location.pathname.startsWith('/page/') ? 'Mobile' : 'Desktop';
        const schemaUid = uid();
        const isMobile = type === 'Mobile';
        const templateSchema = getTemplateSchemaFromPage(fieldSchema.toJSON());
        if (deprecatedTemplate || (await containsReferenceTemplate(templateSchema, schemaTemplateManager))) {
          message.error(t('This block is using some reference templates, please convert to duplicate template first.'));
          return;
        }
        const schemaOfTemplate = {
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
        const newTemplate = {
          title,
          key,
          type,
          description,
          uid: schemaUid,
          configured: true,
          collection: fieldSchema['x-decorator-props']?.collection,
          dataSource: fieldSchema['x-decorator-props']?.dataSource,
          componentType: menuInfo[0],
          menuName: menuInfo[1],
        };
        // step 1: create a template
        await api.resource('blockTemplates').create({ values: newTemplate });
        templates.push(newTemplate);
        plugin.templateInfos.set(key, newTemplate);
        // step 2: create a template blcok schema
        await api.resource('uiSchemas').insert({ values: schemaOfTemplate });
        plugin.setTemplateCache(templateSchema);

        await api.request({
          url: `/uiSchemas:insertAdjacent/${blockId}?position=beforeEnd`,
          method: 'POST',
          data: {
            schema: templateSchema,
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
        // this is a hack to make the schema component refresh to the new schema
        const schema = fieldSchema.toJSON();
        const fillTemplateInfo = (s: ISchema, t: ISchema) => {
          if (!t) {
            return;
          }
          s['x-block-template-key'] = key;
          s['x-template-uid'] = t['x-uid'];
          if (t.properties) {
            for (const key in t.properties) {
              fillTemplateInfo(s.properties[key], t.properties[key]);
            }
          }
        };
        const keepProps = [
          'x-uid',
          'version',
          'x-template-uid',
          'x-block-template-key',
          'x-template-root-uid',
          ...blockKeepProps,
        ];
        const getAllSchemas = (s: ISchema) => {
          const sKeys = Object.keys(s);
          const omitProps = _.reduce(
            sKeys,
            (acc, key) => {
              acc[key] = null;
              return acc;
            },
            {},
          );
          const ret = [{ ...omitProps, ..._.pick(s, keepProps) }];
          if (s.properties) {
            for (const key in s.properties) {
              ret.push(...getAllSchemas(s.properties[key]));
            }
          }
          return ret;
        };

        schema['x-template-root-uid'] = templateSchema['x-uid'];
        schema['x-block-template-key'] = key;
        schema['x-index'] = fieldSchema['x-index'];
        fillTemplateInfo(schema, templateSchema);

        // step 3: batchpatch the schema for sync with template
        await api.request({
          url: `/uiSchemas:batchPatch`,
          method: 'POST',
          data: getAllSchemas(schema),
        });
        // step 4: create a link between template and block
        await blockTemplatesResource.link({
          values: {
            templateKey: key,
            templateBlockUid: templateSchema['x-uid'],
            blockUid: fieldSchema['x-uid'],
          },
        });

        fieldSchema.toJSON = () => {
          addToolbarClass(schema);
          syncExtraTemplateInfo(schema, plugin.templateInfos, plugin.savedSchemaUids);
          return schema;
        };
        refresh({ refreshParentSchema: true });
        // set componentProps, otherwise some components props will not be refreshed
        field['componentProps'] = {
          ...templateSchema['x-component-props'],
          key: uid(),
        };
        if (field.parent?.['componentProps']) {
          field.parent['componentProps'] = {
            ...field.parent['componentProps'],
            key: uid(),
          };
        }
        // set decoratorProps, otherwise title will not be refreshed
        field['decoratorProps'] = {
          ...field['decoratorProps'],
          ...templateSchema['x-decorator-props'],
          key: uid(),
        };
        if (field.parent?.['decoratorProps']) {
          field.parent['decoratorProps'] = {
            ...field.parent['decoratorProps'],
            key: uid(),
          };
        }
        form.reset();
        form.clearFormGraph('*', false);
        message.success(t('Save as template successfully'));
      }}
    />
  );
};

function getTemplateSchemaFromPage(schema: ISchema) {
  const templateSchema = {};
  const traverseSchema = (s: ISchema, t: ISchema) => {
    if (s['x-template-root-uid']) {
      return;
    }
    t = t || {};
    _.merge(t, _.omit(s, ['x-uid', 'properties']));
    t['x-uid'] = uid();
    if (s.properties) {
      for (const key in s.properties) {
        if (s.properties[key]['x-template-root-uid']) {
          continue;
        }
        _.set(t, `properties.['${key}']`, {});
        traverseSchema(s.properties[key], t.properties[key]);
        // array's key will be set to number when render, so we need to set the name to the key
        if (s.type === 'array' && t['properties']?.[key]?.name) {
          _.set(t, `properties.['${key}'].name`, key);
        }
      }
    }
  };
  traverseSchema(schema, templateSchema);
  return templateSchema;
}

async function containsReferenceTemplate(
  schema: ISchema,
  schemaTemplateManager: ReturnType<typeof useSchemaTemplateManager>,
) {
  if (schema['x-component'] === 'BlockTemplate') {
    const templateId = schema['x-component-props']?.templateId;
    if (templateId && schemaTemplateManager.getTemplateById(templateId)) {
      return true;
    }
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      if (await containsReferenceTemplate(schema.properties[key], schemaTemplateManager)) {
        return true;
      }
    }
  }
}
