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
import { useCollection_deprecated } from '../../../../collection-manager/hooks/useCollection_deprecated';
import { useDataBlockProps, useDataBlockRequest } from '../../../../data-source';
import { useDesignable } from '../../../../schema-component';
import { SchemaSettingsModalItem, useCollectionState } from '../../../../schema-settings';

export const setDataLoadingModeSettingsItem = {
  name: 'setDataLoadingMode',
  Component: SetDataLoadingMode,
};

export function useDataLoadingMode() {
  const { dataLoadingMode } = useDataBlockProps() || {};
  return dataLoadingMode || 'auto';
}

export function SetDataLoadingMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { name } = useCollection_deprecated();
  const { getEnableFieldTree, getOnLoadData } = useCollectionState(name);
  const request = useDataBlockRequest();

  return (
    <SchemaSettingsModalItem
      title={t('Set data loading mode')}
      scope={{ getEnableFieldTree, name, getOnLoadData }}
      schema={
        {
          type: 'object',
          title: t('Data loading mode'),
          properties: {
            dataLoadingMode: {
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              default: fieldSchema['x-decorator-props']?.dataLoadingMode || 'auto',
              enum: [
                { value: 'auto', label: t('Load all data when filter is empty') },
                { value: 'manual', label: t('Do not load data when filter is empty') },
              ],
            },
          },
        } as ISchema
      }
      onSubmit={({ dataLoadingMode }) => {
        _.set(fieldSchema, 'x-decorator-props.dataLoadingMode', dataLoadingMode);
        field.decoratorProps.dataLoadingMode = dataLoadingMode;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': {
              ...fieldSchema['x-decorator-props'],
            },
          },
        });
        dn.refresh();

        if (dataLoadingMode === 'auto') {
          request.run();
        } else {
          request.mutate(undefined);
        }
      }}
    />
  );
}
