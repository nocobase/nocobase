/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React from 'react';
import { withDynamicSchemaProps } from '../hoc/withDynamicSchemaProps';
import { DatePickerProvider } from '../schema-component';
import { DefaultValueProvider } from '../schema-settings';
import { CollectOperators } from './CollectOperators';
import { FormBlockProvider } from './FormBlockProvider';

export const FilterFormBlockProvider = withDynamicSchemaProps((props) => {
  const filedSchema = useFieldSchema();
  // 'x-filter-operators' 已被弃用，这里是为了兼容旧的配置
  const deprecatedOperators = filedSchema['x-filter-operators'] || {};

  return (
    <CollectOperators defaultOperators={deprecatedOperators}>
      <DatePickerProvider value={{ utc: false }}>
        <DefaultValueProvider isAllowToSetDefaultValue={() => false}>
          <FormBlockProvider name="filter-form" {...props}></FormBlockProvider>
        </DefaultValueProvider>
      </DatePickerProvider>
    </CollectOperators>
  );
});
