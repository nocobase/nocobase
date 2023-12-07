import {
  SchemaComponent,
  Variable,
  VariableInput,
  VariableScopeProvider,
  getShouldChange,
  useDateVariable,
  useUserVariable,
} from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';

export const ChartFilterVariableInput: React.FC<any> = (props) => {
  const { value, onChange, fieldSchema } = props;
  const userVariable = useUserVariable({
    collectionField: { uiSchema: fieldSchema },
    uiSchema: fieldSchema,
  });
  const dateVariable = useDateVariable({
    operator: fieldSchema['x-component-props']?.['filter-operator'],
    schema: fieldSchema,
    noDisabled: true,
  });
  const options = useMemo(() => [userVariable, dateVariable].filter(Boolean), [dateVariable, userVariable]);
  const schema = {
    ...fieldSchema,
    'x-component': fieldSchema['x-component'] || 'Input',
    'x-decorator': '',
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
        renderSchemaComponent={() => <SchemaComponent schema={schema} />}
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
