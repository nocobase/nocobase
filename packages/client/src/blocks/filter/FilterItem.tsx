import React, { useMemo, useState } from 'react';
import { SchemaField } from '../';
import { createForm, onFieldChange, onFieldReact } from '@formily/core'
import { FormProvider, FormConsumer } from '@formily/react'
import { Field } from '@formily/core/esm/models/Field';
import { Form } from '@formily/core/esm/models/Form';
import {
  Input,
  FormItem,
  FormLayout,
  FormButtonGroup,
  Submit,
  Space,
} from '@formily/antd'
import { CloseCircleOutlined } from '@ant-design/icons'

export const FilterItem = (props) => {
  const { initialValues = {}, fields, onRemove } = props;

  const { key } = initialValues;

  const form = useMemo(
    () =>
      createForm({
        initialValues,
        effects: (form) => {
          onFieldChange('key', (field: Field, form: Form) => {
            form.setFieldState('value', state => {
              state.value = null;
            });
          });
          onFieldReact('op', (field: Field) => {
            const key = field.query('key').get('value');
            const schema = fields.find(field => field.name === key) || {};
            if (schema['x-operations']) {
              field.value = schema['x-operations'][0].value;
              field.dataSource = schema['x-operations'].map(item => ({
                label: item.label,
                value: item.value,
              }));
              console.log({key, schema}, schema['x-operations'][0].value);
            }
          });
          onFieldReact('value', (field: Field, form: Form) => {
            const key = field.query('key').get('value');
            const op = field.query('op').get('value');
            const schema = fields.find(field => field.name === key) || {};
            if (schema['x-operations']) {
              const operation = schema['x-operations'].find(operation => operation.value === op)
              field.visible = operation.noValue ? false : true;
            } else {
              field.visible = true;
            }
            // field.setComponent(getFieldComponent(schema['x-component']));
            // field.visible = opValue ? !opValue.noValue : true;
          });
        },
      }),
    [],
  );

  return (
    <FormProvider form={form}>
      <FormLayout layout={'inline'}>
        <SchemaField>
          <SchemaField.Void
            x-decorator="FormItem"
            x-decorator-props={{
              asterisk: true,
              feedbackLayout: 'none',
              addonAfter: onRemove && (
                <a onClick={() => onRemove()}><CloseCircleOutlined/></a>
              ),
            }}
            x-component="Space"
          >
            <SchemaField.String
              name="key"
              x-decorator="FormItem"
              x-component="Select"
              x-reactions={[
                
              ]}
              x-component-props={{
                style: {
                  width: 100,
                },
              }}
              enum={fields.map(field => ({
                label: field.title,
                value: field.name,
              }))}
              required
            />
            <SchemaField.String
              name="op"
              x-decorator="FormItem"
              x-component="Select"
              x-component-props={{
                style: {
                  width: 100,
                },
              }}
              enum={[]}
              required
            />
            <SchemaField.String
              name="value"
              x-decorator="FormItem"
              x-component="Input"
              required
            />
          </SchemaField.Void>
        </SchemaField>
      </FormLayout>
      {/* <FormConsumer>
        {(form) => {
          return (
            <pre>{JSON.stringify(form.values, null, 2)}</pre>
          )
        }}
      </FormConsumer> */}
    </FormProvider>
  );
}

export default FilterItem;
