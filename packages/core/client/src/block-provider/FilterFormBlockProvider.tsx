/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
