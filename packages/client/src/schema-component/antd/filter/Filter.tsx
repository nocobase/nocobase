import { LoadingOutlined } from '@ant-design/icons';
import { createForm, onFieldValueChange } from '@formily/core';
import { connect, FieldContext, FormContext, ISchema, mapProps, mapReadPretty, Schema } from '@formily/react';
import deepmerge from 'deepmerge';
import React, { useMemo } from 'react';
import { SchemaComponent } from '../../core';
import { FilterGroup } from './FilterGroup';
import './style.less';

export const Filter: any = connect(
  (props) => <FilterGroup bordered={false} {...props} />,
  mapProps((props, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    return null;
  }),
);

interface DynamicValueProps {
  value?: any;
  onChange?: any;
  schema?: Schema;
  operation?: any;
}

Filter.DynamicValue = connect((props: DynamicValueProps) => {
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
  return (
    <FieldContext.Provider value={null}>
      <FormContext.Provider value={form}>
        <SchemaComponent schema={schema} />
      </FormContext.Provider>
    </FieldContext.Provider>
  );
});

export default Filter;
