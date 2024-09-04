/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { SchemaSettings, useDesignable } from '@nocobase/client';
import { useChartsTranslation } from '../locale';
import { AutoRefreshItem } from './AutoRefreshItem';
import { useField, useFieldSchema } from '@formily/react';
import { ChartRendererContext } from '../renderer';

export const chartActionRefreshSettings = new SchemaSettings({
  name: 'chartActionSettings:refresh',
  items: [
    {
      name: 'refresh',
      Component: () => {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { setAutoRefresh } = useContext(ChartRendererContext);
        return (
          <AutoRefreshItem
            value={field.componentProps?.autoRefresh || false}
            onChange={(v) => {
              setAutoRefresh(v);
              field.componentProps = {
                ...field.componentProps,
                autoRefresh: v,
              };
              fieldSchema['x-component-props'] = field.componentProps;
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  'x-component-props': field.componentProps,
                },
              });
              dn.refresh();
            }}
          />
        );
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        const { t } = useChartsTranslation();
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: (s) => {
            return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
          },
          confirm: {
            title: t('Delete action'),
          },
        };
      },
    },
  ],
});
