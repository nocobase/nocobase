import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { FormBlockProvider } from './FormBlockProvider';

export const FilterFormBlockProvider = (props) => {
  return (
    <DatePickerProvider value={{ utc: false }}>
      <FormBlockProvider data-testid="filter-form-block" {...props}></FormBlockProvider>
    </DatePickerProvider>
  );
};
