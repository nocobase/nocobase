/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaComponent,
  VariableInput,
  VariableScopeProvider,
  getShouldChange,
  useCurrentUserVariable,
  useDatetimeVariable,
  CollectionProvider,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo } from 'react';

export const ChartFilterVariableInput: React.FC<any> = (props) => {
  const { value, onChange, fieldSchema } = props;
  const collectionField = fieldSchema?.['x-collection-field'] || '';
  const [collection] = collectionField.split('.');
  const { currentUserSettings } = useCurrentUserVariable({
    collectionField: { uiSchema: fieldSchema },
    uiSchema: fieldSchema,
  });
  const { datetimeSettings } = useDatetimeVariable({
    operator: fieldSchema['x-component-props']?.['filter-operator'],
    schema: fieldSchema,
    noDisabled: true,
  });
  const options = useMemo(
    () => [currentUserSettings, datetimeSettings].filter(Boolean),
    [datetimeSettings, currentUserSettings],
  );
  const schema = {
    ...fieldSchema,
    'x-component': fieldSchema['x-component'] || 'Input',
    'x-decorator': 'CollectionProvider',
    'x-decorator-props': {
      name: collection,
      allowNull: !collection,
    },
    title: '',
    name: 'value',
    default: '',
  };
  const componentProps = fieldSchema['x-component-props'] || {};
  const handleChange = useMemoizedFn(onChange);
  useEffect(() => {
    if (fieldSchema.default) {
      handleChange({ value: fieldSchema.default });
    }
  }, [fieldSchema.default, handleChange]);

  return (
    <VariableScopeProvider scope={options}>
      <VariableInput
        {...componentProps}
        renderSchemaComponent={() => <SchemaComponent schema={schema} components={{ CollectionProvider }} />}
        fieldNames={{}}
        value={value?.value}
        scope={options}
        onChange={(v: any) => {
          onChange({ value: v });
        }}
        shouldChange={getShouldChange({} as any)}
      />
    </VariableScopeProvider>
  );
};
