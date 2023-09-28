import { createForm, onFieldValueChange } from '@formily/core';
import { FieldContext, FormContext } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useContext, useMemo } from 'react';
import { SchemaComponent } from '../../core';
import { useComponent } from '../../hooks';
import { FilterContext } from './context';

const isDateComponent = {
  'DatePicker.RangePicker': true,
  DatePicker: true,
};

export const DynamicComponent = (props) => {
  const { dynamicComponent, disabled } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      disabled,
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
            'x-component-props': merge(props?.schema?.['x-component-props'] || {}, {
              style: {
                minWidth: 150,
              },
            }),
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
      <div data-testid="dynamic-component-filter-item">
        {component
          ? React.createElement(component, {
              value: props.value,
              onChange: props?.onChange,
              renderSchemaComponent,
            })
          : renderSchemaComponent()}
      </div>
    </FormContext.Provider>
  );
};
