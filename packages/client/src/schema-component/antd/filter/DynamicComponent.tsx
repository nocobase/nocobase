import { createForm, onFieldValueChange } from '@formily/core';
import React, { useContext, useMemo } from 'react';
import { FormProvider, SchemaComponent } from '../../../schema-component';
import { useComponent } from '../../hooks';
import { FilterContext } from './context';

export const DynamicComponent = (props) => {
  const { dynamicComponent } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(
    () =>
      createForm({
        values: {
          value: props.value,
        },
        effects() {
          onFieldValueChange('value', (field) => {
            props?.onChange?.(field.value);
          });
        },
      }),
    [JSON.stringify(props.schema), JSON.stringify(props.value)],
  );
  const renderSchemaComponent = () => {
    return (
      <SchemaComponent
        schema={{
          'x-component': 'Input',
          ...props.schema,
          name: 'value',
          'x-read-pretty': false,
        }}
      />
    );
  };
  return (
    <FormProvider form={form}>
      {component
        ? React.createElement(component, {
            value: props.value,
            onChange: props?.onChange,
            renderSchemaComponent,
          })
        : renderSchemaComponent()}
    </FormProvider>
  );
};
