/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItem, useAPIClient, useDesignable } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { useFieldSchema } from '@formily/react';
import { App } from 'antd';
import React from 'react';
import _ from 'lodash';
import { convertTplBlock } from '../initializers/TemplateBlockInitializer';
import { Schema } from '@formily/json-schema';

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
  // const { dn, template } = useSchemaSettings();
  const { dn, reset, refresh } = useDesignable();
  const { t } = useTranslation();
  const api = useAPIClient();
  // const field = useField<Field>();
  // const compile = useCompile();
  const fieldSchema = useFieldSchema();
  // const form = useForm();
  const { modal } = App.useApp();

  return (
    <SchemaSettingsItem
      title="Reset"
      eventKey="reset"
      onClick={() => {
        modal.confirm({
          title: t('Reset'),
          content: t('Are you sure you want to reset all changes from the template?'),
          ...confirm,
          async onOk() {
            const templateSchemaId = _.get(fieldSchema, 'x-template-uid');
            console.log('templateSchemaId', templateSchemaId);
            const res = await api.request({
              url: `/uiSchemas:getJsonSchema/${templateSchemaId}`,
            });
            console.log('res', res);
            const templateSchema = res.data?.data;
            const rootSchema = findParentRootTemplateSchema(fieldSchema);
            const isRoot = rootSchema === fieldSchema;
            const newSchema = convertTplBlock(templateSchema, false, isRoot, rootSchema['x-uid']);
            console.log('newSchema', newSchema);

            // patch the schema
            // dn.emit('patch', {
            //   schema: newSchema,
            // });
            // dn.current = templateSchema;

            // await api.request({
            //   url: `/templateBlock:reset`,
            //   method: 'post',
            //   data: cleanSchema(newSchema),
            // });

            // 删除老的schema
            const position = findInsertPosition(fieldSchema.parent, fieldSchema['x-uid']);
            console.log('position', position);

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
            // dn.refresh({ refreshParentSchema: true });
            // dn.reset();
            fieldSchema.toJSON = () => {
              if (schema['x-template-root-uid'] || fieldSchema.parent?.['x-template-root-uid']) {
                return schema.toJSON();
              } else {
                const mergedSchema = _.merge(templateSchema, schema.toJSON());
                return mergedSchema;
              }
            };
            refresh({ refreshParentSchema: true });
            // reset();
          },
        });
      }}
    >
      {t('Reset')}
    </SchemaSettingsItem>
  );
};
