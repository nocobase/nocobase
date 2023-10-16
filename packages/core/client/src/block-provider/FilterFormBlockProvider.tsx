import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { FormBlockProvider } from './FormBlockProvider';

export const FilterFormBlockProvider = (props) => {
  const { collection, resource } = props;

  return (
    <DatePickerProvider value={{ utc: false }}>
      <FormBlockProvider data-testid={`filter-form-block-${collection || resource}`} {...props}></FormBlockProvider>
    </DatePickerProvider>
  );
};
