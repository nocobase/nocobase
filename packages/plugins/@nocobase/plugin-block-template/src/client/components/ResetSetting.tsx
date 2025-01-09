/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItem, useAPIClient, useDesignable, useFormBlockProps, usePlugin } from '@nocobase/client';
import { useFieldSchema, useForm } from '@formily/react';
import { App } from 'antd';
import React from 'react';
import _ from 'lodash';
import { convertTplBlock } from '../initializers/TemplateBlockInitializer';
import { Schema } from '@formily/json-schema';
import { useT } from '../locale';
import PluginBlockTemplateClient from '..';

const cleanSchema = (schema) => {
  const s = { ...schema, 'x-component-props': {}, 'x-decorator-props': {} };
  if (s.properties) {
    for (const key in s.properties) {
      s.properties[key] = cleanSchema(s.properties[key]);
    }
  } else {
    s.properties = null;
  }
  return s;
};

const findInsertPosition = (parentSchema, uid) => {
  const postion = {
    insertPosition: 'beforeBegin',
    insertTarget: null,
  };
  const properties = Object.values(parentSchema.properties || {}).sort((a, b) => {
    return (a as any)['x-index'] - (b as any)['x-index'];
  });
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    if ((property as any)['x-uid'] === uid) {
      postion.insertPosition = 'beforeBegin';
      if (i === properties.length - 1) {
        postion.insertPosition = 'beforeEnd';
        postion.insertTarget = parentSchema['x-uid'];
      } else {
        postion.insertPosition = 'beforeBegin';
        postion.insertTarget = (properties[i + 1] as any)['x-uid'];
      }
    }
  }
  return postion;
};

const findParentRootTemplateSchema = (fieldSchema) => {
  if (fieldSchema['x-template-root-uid']) {
    return fieldSchema;
  } else {
    return findParentRootTemplateSchema(fieldSchema.parent);
  }
};

export const ResetSetting = () => {
  const { refresh } = useDesignable();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const t = useT();
  const api = useAPIClient();
  const form = useForm();
  const { form: blockForm } = useFormBlockProps();
  const fieldSchema = useFieldSchema();
  const { modal, message } = App.useApp();

  return (
    <SchemaSettingsItem
      title={t('Revert to template')}
      onClick={() => {
        modal.confirm({
          title: t('Revert to template'),
          content: t('Are you sure you want to revert all changes from the template?'),
          ...confirm,
          async onOk() {
            const templateSchemaId = _.get(fieldSchema, 'x-template-uid');
            const res = await api.request({
              url: `/uiSchemas:getJsonSchema/${templateSchemaId}`,
            });
            const templateSchema = res.data?.data;
            const rootSchema = findParentRootTemplateSchema(fieldSchema);
            const isRoot = rootSchema === fieldSchema;
            if (isRoot) {
              plugin.templateschemacache[templateSchema['x-uid']] = templateSchema;
            }
            const newSchema = convertTplBlock(
              templateSchema,
              false,
              isRoot,
              rootSchema['x-uid'],
              rootSchema['x-template-title'],
            );

            // remove old schema
            const position = findInsertPosition(fieldSchema.parent, fieldSchema['x-uid']);

            await api.request({
              url: `/uiSchemas:remove/${newSchema['x-uid']}?resettemplate=true`,
            });

            // insertAdjacent
            const schema = new Schema(newSchema);
            schema.name = fieldSchema.name;
            await api.request({
              url: `/uiSchemas:insertAdjacent/${position.insertTarget}?position=${position.insertPosition}`,
              method: 'post',
              data: {
                schema,
              },
            });

            // this is a hack to make the schema component refresh to the new schema
            fieldSchema.toJSON = () => {
              if (schema['x-template-root-uid'] || fieldSchema.parent?.['x-template-root-uid']) {
                return schema.toJSON();
              } else {
                const mergedSchema = _.merge(templateSchema, schema.toJSON());
                return mergedSchema;
              }
            };
            refresh({ refreshParentSchema: true });
            form.clearFormGraph();
            blockForm?.clearFormGraph();
            message.success(t('Reset successfully'), 0.2);
          },
        });
      }}
    >
      {t('Revert to template')}
    </SchemaSettingsItem>
  );
};
