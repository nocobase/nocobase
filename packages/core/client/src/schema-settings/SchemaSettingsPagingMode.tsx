/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTableBlockContext } from '../block-provider';
import { useDesignable } from '../schema-component/hooks/useDesignable';
import { SchemaSettingsSelectItem } from './SchemaSettings';

export function SchemaSettingsPagingMode() {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const { service } = useTableBlockContext();
  const options = [
    {
      value: 'default',
      label: t('Default'),
    },
    {
      value: 'simplePaginate',
      label: t('Simple Paginate'),
    },
  ];

  return (
    <SchemaSettingsSelectItem
      key="paging-mode"
      title={t('Paging mode')}
      options={options}
      value={field.decoratorProps.pagingMode || 'default'}
      onChange={(pagingMode) => {
        fieldSchema['x-decorator-props'].pagingMode = pagingMode;
        service.run({ ...service.params?.[0], simplePaginate: pagingMode === 'simplePaginate' });
        field.decoratorProps.pagingMode = pagingMode;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
}
