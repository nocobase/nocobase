import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { DefaultValueProvider } from '../schema-settings';
import { FormBlockProvider } from './FormBlockProvider';

export const FilterFormBlockProvider = (props) => {
  return (
    <DatePickerProvider value={{ utc: false }}>
      <DefaultValueProvider isAllowToSetDefaultValue={() => false}>
        <FormBlockProvider name="filter-form" {...props}></FormBlockProvider>
      </DefaultValueProvider>
    </DatePickerProvider>
  );
};
