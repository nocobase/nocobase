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
  CollectionProvider,
  IsInNocoBaseRecursionFieldContext,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect } from 'react';
import { useGeneralVariableOptions } from '../hooks';

export const ChartFilterVariableInput: React.FC<any> = (props) => {
  const { value, onChange, fieldSchema } = props;
  const collectionField = fieldSchema?.['x-collection-field'] || '';
  const [collection] = collectionField.split('.');
  const options = useGeneralVariableOptions(fieldSchema, fieldSchema['x-component-props']?.['filter-operator']);
  const schema = {
    ...fieldSchema,
    'x-component': fieldSchema['x-component'] || 'Input',
    title: '',
    name: 'value',
    default: '',
    'x-read-pretty': false,
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
        renderSchemaComponent={() => (
          <CollectionProvider name={collection} allowNull={!collection}>
            <IsInNocoBaseRecursionFieldContext.Provider value={false}>
              <SchemaComponent schema={schema} />
            </IsInNocoBaseRecursionFieldContext.Provider>
          </CollectionProvider>
        )}
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
