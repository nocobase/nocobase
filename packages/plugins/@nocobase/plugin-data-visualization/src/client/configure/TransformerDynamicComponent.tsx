/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Field } from '@formily/core';

export const TransformerDynamicComponent: React.FC<{
  schema: any;
}> = (props) => {
  const { schema } = props;
  const field = useField<Field>();

  if (!schema) {
    return null;
  }

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          [schema.name]: {
            type: 'void',
            ...schema,
            value: field.value,
            'x-component-props': {
              ...schema['x-component-props'],
              defaultValue: field.value,
              onChange: (e: any) => {
                if (typeof e === 'object' && e?.target) {
                  field.value = e.target.value;
                  return;
                }
                field.value = e;
              },
            },
          },
        },
      }}
    />
  );
};
