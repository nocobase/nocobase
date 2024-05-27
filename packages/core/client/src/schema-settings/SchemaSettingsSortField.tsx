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
import { useCollectionManager_deprecated } from '../collection-manager/hooks/useCollectionManager_deprecated';
import { useCollection_deprecated } from '../collection-manager/hooks/useCollection_deprecated';
import { useCompile } from '../schema-component/hooks/useCompile';
import { useDesignable } from '../schema-component/hooks/useDesignable';
import { SchemaSettingsSelectItem } from './SchemaSettings';

export function SchemaSettingsSortField() {
  const { fields } = useCollection_deprecated();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const { service, association } = useTableBlockContext();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(association);
  const options = fields
    .filter((field) => !field?.target && field.interface === 'sort')
    .map((field) => {
      return {
        value: field?.name,
        label: compile(field?.uiSchema?.title) || field?.name,
        disabled: field?.scopeKey && collectionField?.foreignKey !== field.scopeKey,
      };
    });

  return (
    <SchemaSettingsSelectItem
      key="sort-field"
      title={t('Drag and drop sorting field')}
      options={options}
      value={field.decoratorProps.dragSortBy}
      onChange={(dragSortBy) => {
        fieldSchema['x-decorator-props'].dragSortBy = dragSortBy;
        service.run({ ...service.params?.[0], sort: dragSortBy });
        field.decoratorProps.dragSortBy = dragSortBy;
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
