import React from 'react';
import { DatePickerProvider } from '../schema-component';
import { FormBlockProviderV2 } from './FormBlockProvider';

export const FilterFormBlockProvider = (props) => {
  const { collection, resource } = props;

  return (
    <DatePickerProvider value={{ utc: false }}>
      <FormBlockProviderV2 blockType="filter-form" {...props}></FormBlockProviderV2>
    </DatePickerProvider>
  );
};
