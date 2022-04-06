import { createForm, onFieldValueChange } from '@formily/core';
import { FieldContext, FormContext } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { SchemaComponent } from '../../core';
import { useComponent } from '../../hooks';
import { FilterContext } from './context';

export const DynamicComponent = (props) => {
  const { dynamicComponent } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      effects() {
        onFieldValueChange('value', (field) => {
          props?.onChange?.(field.value);
        });
      },
    });
  }, [JSON.stringify(props.schema), JSON.stringify(props.value)]);
  const renderSchemaComponent = () => {
    return (
      <FieldContext.Provider value={null}>
        <SchemaComponent
          schema={{
            'x-component': 'Input',
            ...props.schema,
            name: 'value',
            'x-read-pretty': false,
            'x-validator': undefined,
            'x-decorator': undefined,
          }}
        />
      </FieldContext.Provider>
    );
  };
  return (
    <FormContext.Provider value={form}>
      {component
        ? React.createElement(component, {
            value: props.value,
            onChange: props?.onChange,
            renderSchemaComponent,
          })
        : renderSchemaComponent()}
    </FormContext.Provider>
  );
};
