/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItem, useAPIClient, useDesignable, useFormBlockProps } from '@nocobase/client';
import { useFieldSchema, useForm, useField } from '@formily/react';
import { App } from 'antd';
import React from 'react';
import _ from 'lodash';
import { Schema } from '@formily/json-schema';
import { useT } from '../locale';
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

// Create a copy of the schema with all template associations removed
const convertToNormalBlockSchema = (schema) => {
  const newSchema = _.cloneDeep(schema);

  // Remove template associations from the schema
  const removeTemplateAssociations = (s) => {
    // Remove template-specific properties
    delete s['x-template-uid'];
    delete s['x-template-root-uid'];
    delete s['x-template-version'];
    delete s['x-block-template-key'];
    delete s['x-template-root-ref'];
    delete s['x-template-title'];
    delete s['x-virtual'];

    if (s['x-toolbar-props']?.toolbarClassName?.includes('nb-in-template')) {
      s['x-toolbar-props'].toolbarClassName = s['x-toolbar-props'].toolbarClassName.replace('nb-in-template', '');
    }

    if (s['x-uid']) {
      s['x-uid'] = uid();
    }
    // Process nested properties
    if (s.properties) {
      for (const key in s.properties) {
        if (!s.properties[key]['x-template-root-uid']) {
          removeTemplateAssociations(s.properties[key]);
        }
      }
    }
  };

  removeTemplateAssociations(newSchema);
  return newSchema;
};

export const ConvertToNormalBlockSetting = () => {
  const { refresh } = useDesignable();
  const t = useT();
  const api = useAPIClient();
  const form = useForm();
  const field = useField();
  const { form: blockForm } = useFormBlockProps();
  const fieldSchema = useFieldSchema();
  const { modal, message } = App.useApp();
  const blockTemplatesResource = api.resource('blockTemplates');

  const confirm = {
    okText: t('Yes'),
    cancelText: t('No'),
  };

  return (
    <SchemaSettingsItem
      title={t('Convert to normal block')}
      onClick={() => {
        modal.confirm({
          title: t('Convert to normal block'),
          content: t('Are you sure you want to convert this template block to a normal block?'),
          ...confirm,
          async onOk() {
            const newSchema = convertToNormalBlockSchema(fieldSchema.toJSON());
            const position = findInsertPosition(fieldSchema.parent, fieldSchema['x-uid']);
            // TODO: Remove old schema, and links

            // Remove old schema
            await api.request({
              url: `/uiSchemas:remove/${fieldSchema['x-uid']}`,
            });

            // Insert new schema
            const schema = new Schema(newSchema);
            await api.request({
              url: `/uiSchemas:insertAdjacent/${position.insertTarget}?position=${position.insertPosition}`,
              method: 'post',
              data: {
                schema,
              },
            });

            // Update the UI to show the new schema
            fieldSchema.toJSON = () => {
              const ret = schema.toJSON();
              return ret;
            };

            refresh({ refreshParentSchema: true });

            // Update component properties
            field['componentProps'] = {
              ...field['componentProps'],
              key: uid(),
            };

            if (field.parent?.['componentProps']) {
              field.parent['componentProps'] = {
                ...field.parent['componentProps'],
                key: uid(),
              };
            }

            // Update decorator properties
            field['decoratorProps'] = {
              ...field['decoratorProps'],
              key: uid(),
            };

            if (field.parent?.['decoratorProps']) {
              field.parent['decoratorProps'] = {
                ...field.parent['decoratorProps'],
                key: uid(),
              };
            }

            // Reset forms
            form.reset();
            blockForm?.reset();
            form.clearFormGraph('*', false);
            blockForm?.clearFormGraph('*', false);

            message.success(t('Converted successfully'), 0.2);
          },
        });
      }}
    >
      {t('Convert to normal block')}
    </SchemaSettingsItem>
  );
};
