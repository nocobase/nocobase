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

export const Layout = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
};

export const SchemaSettingsLayoutItem = function LayoutItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Layout')}
      schema={
        {
          type: 'object',
          title: t('Set block layout'),
          properties: {
            layout: {
              type: 'string',
              enum: [
                { label: t('Vertical'), value: Layout.VERTICAL },
                { label: t('Horizontal'), value: Layout.HORIZONTAL },
              ],
              required: true,
              default: fieldSchema?.['x-component-props']?.layout || Layout.VERTICAL,
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
            },
            labelAlign: {
              title: t('Label align'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['labelAlign'] || 'left',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              enum: [
                { label: "{{t('Right')}}", value: 'right' },
                { label: "{{t('Left')}}", value: 'left' },
              ],
              'x-reactions': {
                dependencies: ['layout'],
                fulfill: {
                  state: {
                    visible: '{{ $deps[0]==="horizontal"}}',
                  },
                },
              },
            },
            labelWidth: {
              title: t('Label width'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['labelWidth'] || 120,
              required: true,
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                addonAfter: 'px',
              },
              'x-validator': [
                {
                  minimum: 50,
                },
              ],
              'x-reactions': {
                dependencies: ['layout'],
                fulfill: {
                  state: {
                    visible: '{{ $deps[0]==="horizontal"}}',
                  },
                },
              },
            },
            labelWrap: {
              type: 'string',
              title: t('When the Label exceeds the width'),
              enum: [
                { label: t('Line break'), value: true },
                { label: t('Ellipsis'), value: false },
              ],
              default: fieldSchema?.['x-component-props']?.labelWrap !== false,
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-reactions': {
                dependencies: ['layout'],
                fulfill: {
                  state: {
                    visible: '{{ $deps[0]==="horizontal"}}',
                  },
                },
              },
            },
            colon: {
              type: 'boolean',
              'x-content': t('Colon'),
              required: true,
              default: fieldSchema?.['x-component-props']?.colon !== false,
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
            },
          },
        } as ISchema
      }
      onSubmit={({ layout, labelAlign, labelWidth, labelWrap, colon }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.layout = layout;
        componentProps.labelAlign = labelAlign;
        componentProps.labelWidth = layout === 'horizontal' ? labelWidth : null;
        componentProps.labelWrap = labelWrap;
        componentProps.colon = colon;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.layout = layout;
        field.componentProps.labelAlign = labelAlign;
        field.componentProps.labelWidth = labelWidth;
        field.componentProps.labelWrap = labelWrap;
        field.componentProps.colon = colon;
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
