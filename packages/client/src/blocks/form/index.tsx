import React, { useEffect, useMemo } from 'react';
import { Form as Formily, FormButtonGroup, Submit, Reset } from '@formily/antd';
import { createForm } from '@formily/core';
import { SchemaField, fields2properties, parseEffects } from '../../';
import { Resource, ResourceOptions } from '../../resource';

export interface FormBlockProps {
  effects?: any;
  fields?: any;
  initialValues?: any;
  onSuccess?: any;
  resource: string | Resource | ResourceOptions;
  readPretty?: boolean;
  [key: string]: any;
}

export const FormBlock = (props: FormBlockProps) => {
  const { initialValues, fields = [], effects, onSuccess, readPretty } = props;
  const form = useMemo(
    () =>
      createForm({
        readPretty,
        initialValues,
        effects: (form) => parseEffects(effects, form),
      }),
    [],
  );
  const resource = Resource.make(props.resource);
  useEffect(() => {
    if (!initialValues) {
      resource.get().then(({ data }) => {
        form.setInitialValues(data);
      });
    }
  }, [initialValues]);
  return (
    <Formily
      form={form}
      layout={'vertical'}
      onAutoSubmit={async (values) => {
        console.log(form.values, values);
        try {
          const { data } = await resource.save(values);
          if (onSuccess) {
            return onSuccess(data);
          }
          return data;
        } catch (error) {}
      }}
    >
      <SchemaField
        schema={{
          type: 'object',
          properties: fields2properties(fields),
        }}
      />
      {!readPretty && (
        <FormButtonGroup>
          <Submit>提交</Submit>
          <Reset>取消</Reset>
        </FormButtonGroup>
      )}
    </Formily>
  );
};

export default FormBlock;
