import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { FormBlockProvider } from './FormBlockProvider';

export const FilterFormBlockProvider = (props) => {
  const { collection, resource } = props;

  return (
    <DatePickerProvider value={{ utc: false }}>
      <FormBlockProvider name="filter-form" {...props}></FormBlockProvider>
    </DatePickerProvider>
  );
};
