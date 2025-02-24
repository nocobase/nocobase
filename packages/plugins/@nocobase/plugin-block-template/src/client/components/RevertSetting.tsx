/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettingsItem,
  useAPIClient,
  useDesignable,
  useFormBlockProps,
  usePlugin,
  SchemaSettingsDivider,
} from '@nocobase/client';
import { useFieldSchema, useForm, useField } from '@formily/react';
import { App } from 'antd';
import React from 'react';
import _ from 'lodash';
import { blockKeepProps, convertTplBlock, formSchemaPatch } from '../initializers/TemplateBlockInitializer';
import { Schema } from '@formily/json-schema';
import { useT } from '../locale';
import PluginBlockTemplateClient from '..';
import { addToolbarClass, syncExtraTemplateInfo } from '../utils/template';
import { uid } from '@nocobase/utils/client';

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
  if (!fieldSchema) {
    return null;
  }
  if (fieldSchema['x-template-root-uid']) {
    return fieldSchema;
  } else {
    return findParentRootTemplateSchema(fieldSchema.parent);
  }
};

export const RevertSetting = () => {
  const { refresh, remove } = useDesignable();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const t = useT();
  const api = useAPIClient();
  const form = useForm();
  const field = useField();
  // const { runAsync } = useDataBlockRequest();
  const { form: blockForm } = useFormBlockProps();
  const fieldSchema = useFieldSchema();
  const { modal, message } = App.useApp();

  return (
    <>
      <SchemaSettingsDivider />
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
              if (!templateSchema?.['x-uid']) {
                // this means the template has already been deleted
                remove(null, {
                  removeParentsIfNoChildren: true,
                  breakRemoveOn: {
                    'x-component': 'Grid',
                  },
                });
                refresh({ refreshParentSchema: true });
                form.reset();
                form.clearFormGraph();
                blockForm?.clearFormGraph();
                message.success(t('Reset successfully'), 0.2);
                return;
              }

              const rootSchema = findParentRootTemplateSchema(fieldSchema);
              const isRoot = rootSchema === fieldSchema;
              if (isRoot) {
                plugin.setTemplateCache(templateSchema);
              } else {
                // patch the edit form button schema, keep same as the form
                if (fieldSchema['x-settings']?.includes('updateSubmit')) {
                  templateSchema['x-settings'] = 'actionSettings:updateSubmit';
                  templateSchema['x-use-component-props'] = 'useUpdateActionProps';
                }
              }
              // patch filter block
              // remove this when multiple blocks template supported
              if (fieldSchema['x-filter-targets']) {
                templateSchema['x-filter-targets'] = fieldSchema['x-filter-targets'];
              }

              const newSchema = convertTplBlock(
                templateSchema,
                false,
                isRoot,
                rootSchema?.['x-uid'],
                rootSchema?.['x-block-template-key'],
              );
              newSchema['x-index'] = fieldSchema['x-index'];
              for (const p of blockKeepProps) {
                if (_.hasIn(fieldSchema, p)) {
                  _.set(newSchema, p, _.get(fieldSchema, p));
                }
              }
              if (
                fieldSchema['x-decorator'] === 'FormBlockProvider' &&
                fieldSchema['x-use-decorator-props'] === 'useEditFormBlockDecoratorProps'
              ) {
                formSchemaPatch(newSchema, {
                  collectionName: fieldSchema['x-decorator-props']['collection'],
                  dataSourceName: fieldSchema['x-decorator-props']['dataSource'],
                  association: fieldSchema['x-decorator-props']['association'],
                  currentRecord: true,
                });
              }
              // remove old schema
              const position = findInsertPosition(fieldSchema.parent, fieldSchema['x-uid']);

              await api.request({
                url: `/uiSchemas:remove/${fieldSchema['x-uid']}`,
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
                let ret;
                if (schema['x-template-root-uid'] || fieldSchema.parent?.['x-template-root-uid']) {
                  ret = schema.toJSON();
                } else {
                  const mergedSchema = _.merge(templateSchema, schema.toJSON());
                  ret = mergedSchema;
                }
                addToolbarClass(ret);
                syncExtraTemplateInfo(ret, plugin.templateInfos, plugin.savedSchemaUids);
                return ret;
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
              blockForm?.reset();
              form.clearFormGraph('*', false);
              blockForm?.clearFormGraph('*', false);

              message.success(t('Reset successfully'), 0.2);
            },
          });
        }}
      >
        {t('Revert to template')}
      </SchemaSettingsItem>
    </>
  );
};
