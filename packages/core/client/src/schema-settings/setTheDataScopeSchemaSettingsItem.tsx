/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { SchemaSettingsItemType } from '../application';
import { useFormBlockContext, useTableBlockContext } from '../block-provider';
import { useCollection_deprecated } from '../collection-manager';
import { useDesignable, removeNullCondition } from '../schema-component';
import { SchemaSettingsDataScope } from './SchemaSettingsDataScope';
import { useCollection } from '../data-source';

export const setTheDataScopeSchemaSettingsItem: SchemaSettingsItemType = {
  name: 'SetTheDataScope',
  Component: SchemaSettingsDataScope,
  useComponentProps: () => {
    const { name } = useCollection_deprecated();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { form } = useFormBlockContext();
    const { service } = useTableBlockContext();
    const { dn } = useDesignable();
    const onDataScopeSubmit = useCallback(
      ({ filter }) => {
        filter = removeNullCondition(filter);
        const params = field.decoratorProps.params || {};
        params.filter = filter;
        field.decoratorProps.params = params;
        fieldSchema['x-decorator-props']['params'] = params;

        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        service.params[0].page = 1;
      },
      [dn, field.decoratorProps, fieldSchema, service],
    );

    return {
      collectionName: name,
      defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
      form: form,
      onSubmit: onDataScopeSubmit,
    };
  },
};
