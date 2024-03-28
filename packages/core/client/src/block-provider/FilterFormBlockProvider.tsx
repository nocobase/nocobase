import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { DefaultValueProvider } from '../schema-settings';
import { FormBlockProvider } from './FormBlockProvider';
import { withDynamicSchemaProps } from '../application/hoc/withDynamicSchemaProps';

export const FilterFormBlockProvider = withDynamicSchemaProps((props) => {
  return (
    <DatePickerProvider value={{ utc: false }}>
      <DefaultValueProvider isAllowToSetDefaultValue={() => false}>
        <FormBlockProvider name="filter-form" {...props}></FormBlockProvider>
      </DefaultValueProvider>
    </DatePickerProvider>
  );
});
