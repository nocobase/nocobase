/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SchemaSettingsModalItem } from './SchemaSettings';
import { useDesignable } from '../schema-component/hooks/useDesignable';

export const HeightMode = {
  DEFAULT: 'defaultHeight',
  SPECIFY_VALUE: 'specifyValue',
  FULL_HEIGHT: 'fullHeight',
};

export const SchemaSettingsBlockHeightItem = function BlockTitleItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Set block height')}
      schema={
        {
          type: 'object',
          title: t('Set block height'),
          properties: {
            heightMode: {
              type: 'string',
              enum: [
                { label: t('Default'), value: HeightMode.DEFAULT },
                { label: t('Specify height'), value: HeightMode.SPECIFY_VALUE },
                { label: t('Full height'), value: HeightMode.FULL_HEIGHT },
              ],
              required: true,
              default: fieldSchema?.['x-component-props']?.heightMode || HeightMode.DEFAULT,
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
            },
            height: {
              title: t('Height'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['height'],
              required: true,
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                addonAfter: 'px',
              },
              'x-validator': [
                {
                  minimum: 40,
                },
              ],
              'x-reactions': {
                dependencies: ['heightMode'],
                fulfill: {
                  state: {
                    hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
                    value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
                  },
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ heightMode, height }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.heightMode = heightMode;
        componentProps.height = height;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.heightMode = heightMode;
        field.componentProps.height = height;

        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
};
