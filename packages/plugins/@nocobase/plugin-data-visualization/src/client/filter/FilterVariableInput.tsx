import { SchemaComponent, Variable } from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { useUserVariable } from '../hooks/useUserVariable';
import { useDateVariable } from '../hooks/useDateVariable';
import { useMemoizedFn } from 'ahooks';

export const ChartFilterVariableInput: React.FC<any> = (props) => {
  const { value, onChange, fieldSchema } = props;
  const userVariable = useUserVariable({ schema: fieldSchema });
  const dateVariable = useDateVariable({ schema: fieldSchema });
  const options = useMemo(() => [userVariable, dateVariable].filter(Boolean), [dateVariable, userVariable]);
  const schema = {
    ...fieldSchema,
    'x-component': fieldSchema['x-component'] || 'Input',
    'x-decorator': '',
    title: '',
    name: 'value',
    'x-component-props': {
      ...(fieldSchema['x-component-props'] || {}),
      defaultValue: '',
    },
  };
  const componentProps = fieldSchema['x-component-props'] || {};
  const handleChange = useMemoizedFn(onChange);
  useEffect(() => {
    if (componentProps.defaultValue) {
      handleChange({ value: componentProps.defaultValue });
    }
  }, [componentProps.defaultValue, handleChange]);

  return (
    <Variable.Input
      {...componentProps}
      fieldNames={{}}
      value={value?.value}
      scope={options}
      onChange={(v: any) => {
        onChange({ value: v });
      }}
    >
      <SchemaComponent schema={schema} />
    </Variable.Input>
  );
};
