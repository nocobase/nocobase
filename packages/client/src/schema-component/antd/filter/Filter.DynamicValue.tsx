import { createForm, onFieldValueChange } from '@formily/core';
import type { ISchema, Schema } from '@formily/react';
import { connect } from '@formily/react';
import deepmerge from 'deepmerge';
import React, { useMemo } from 'react';
import { SchemaComponent } from '../../core';

interface DynamicValueProps {
  value?: any;
  onChange?: any;
  schema?: Schema;
  operation?: any;
}

export const FilterDynamicValue = connect((props: DynamicValueProps) => {
  const { onChange, value, operation } = props;
  const fieldName = Object.keys(props?.schema?.properties || {}).shift() ?? 'value';
  const fieldSchema = Object.values(props?.schema?.properties || {}).shift();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [fieldName]: value,
        },
        effects(form) {
          onFieldValueChange(fieldName, (field) => {
            onChange(field.value);
          });
        },
      }),
    [],
  );
  const extra: ISchema = deepmerge(
    {
      required: false,
      'x-read-pretty': false,
      name: fieldName,
      default: value,
      'x-decorator': 'FormilyFormItem',
      'x-decorator-props': {
        asterisk: true,
        feedbackLayout: 'none',
      },
      'x-component-props': {
        style: {
          minWidth: '150px',
        },
      },
    },
    operation?.schema || {},
  );
  const schema = {
    type: 'object',
    properties: {
      [fieldName]: deepmerge(fieldSchema, extra, {
        arrayMerge: (target, source) => source,
      }) as any,
    },
  };
  return <SchemaComponent schema={schema} />;
});
