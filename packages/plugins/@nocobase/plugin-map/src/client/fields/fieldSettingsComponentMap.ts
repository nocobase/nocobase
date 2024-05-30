/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import { SchemaSettings, SchemaSettingsModalItem, useDesignable } from '@nocobase/client';
import _ from 'lodash';
import { useMapTranslation } from '../locale';

export const fieldSettingsComponentMap = new SchemaSettings({
  name: 'fieldSettings:component:Map',
  items: [
    {
      name: 'defaultZoomLevel',
      Component: SchemaSettingsModalItem,
      useComponentProps() {
        const { t } = useMapTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        const defaultZoom = fieldSchema?.['x-component-props']?.['zoom'] || 13;
        return {
          title: t('The default zoom level of the map'),
          schema: {
            type: 'object',
            title: t('Set default zoom level'),
            properties: {
              zoom: {
                title: t('Zoom'),
                default: defaultZoom,
                'x-component': 'InputNumber',
                'x-decorator': 'FormItem',
                'x-component-props': {
                  precision: 0,
                },
              },
            },
          } as ISchema,
          onSubmit: ({ zoom }) => {
            _.set(fieldSchema, 'x-component-props.zoom', zoom);
            Object.assign(field.componentProps, fieldSchema['x-component-props']);
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});
