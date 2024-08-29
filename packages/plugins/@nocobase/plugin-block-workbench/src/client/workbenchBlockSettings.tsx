/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, SchemaSettingsSelectItem, useDesignable } from '@nocobase/client';
import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';

const ActionPanelLayout = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { dn } = useDesignable();
  return (
    <SchemaSettingsSelectItem
      title={t('Layout')}
      options={[
        { label: t('Grid'), value: 'grid' },
        { label: t('List'), value: 'list' },
      ]}
      value={fieldSchema?.['x-component-props']?.layout || 'grid'}
      onChange={(value) => {
        field.componentProps.layout = value;
        const schema = {
          'x-uid': fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        schema['x-component-props'] = fieldSchema['x-component-props'] || {};
        schema['x-component-props'].layout = value;
        fieldSchema['x-component-props'].layout = value;
        dn.emit('patch', {
          schema: schema,
        });
        dn.refresh();
      }}
    />
  );
};

export const workbenchBlockSettings = new SchemaSettings({
  name: 'blockSettings:workbench',
  items: [
    {
      name: 'layout',
      Component: ActionPanelLayout,
    },
    {
      type: 'remove',
      name: 'remove',
    },
  ],
});
