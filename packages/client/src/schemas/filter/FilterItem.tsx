import React, { useContext, useMemo, useState } from 'react';
import { SchemaField } from '..';
import { createForm, onFieldChange, onFieldReact } from '@formily/core';
import { FormProvider, FormConsumer, useFieldSchema, Schema, SchemaOptionsContext, ISchema } from '@formily/react';
import { Field } from '@formily/core/esm/models/Field';
import { Form } from '@formily/core/esm/models/Form';
import {
  Input,
  FormItem,
  FormLayout,
  FormButtonGroup,
  Submit,
  Space,
} from '@formily/antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { get } from 'lodash';

function useFilterColumns(): Schema[] {
  const schema = useFieldSchema();
  const columns = schema.reduceProperties((columns, current) => {
    if (current['x-component'] === 'Filter.Column') {
      return [...columns, current];
    }
    return [...columns];
  }, []);
  return columns;
}

export const FilterItem = (props) => {
  const { initialValues = {}, onRemove } = props;

  const options = useContext(SchemaOptionsContext);

  const { key } = initialValues;
  const columns = useFilterColumns();
  console.log('useFilterColumns', columns);

  const Remove = (props) => {
    return (
      onRemove && (
        <a onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )
    );
  };

  const getComponent = (column: ISchema) => {
    const field = Object.values(column.properties).shift();
    return field ? get(options.components, field['x-component']) : null;
  }

  const form = useMemo(
    () =>
      createForm({
        initialValues,
        effects: (form) => {
          onFieldChange('column', (field: Field, form: Form) => {
            const column = (field.value || {}) as ISchema;
            const operations = column?.['x-component-props']?.['operations']||[];
            field.query('operation').take((f: Field) => {
              f.setDataSource(operations);
              f.initialValue = get(operations, [0]);
            });
            field.query('value').take((f: Field) => {
              f.value = null;
              const component = getComponent(column);
              console.log({ component });
              f.setComponent(component, {});
            });
          });
          onFieldReact('operation', (field: Field) => {
            console.log('operation', field.value);
            const operation = field.value || {};
            field.query('value').take((f: Field) => {
              f.visible = !operation.noValue;
            });
          });
        },
      }),
    [],
  );


  return (
    <FormProvider form={form}>
      <FormLayout layout={'inline'}>
        <SchemaField components={{ Remove }}>
          <SchemaField.Void x-component="Space">
            <SchemaField.String
              name="column"
              x-decorator="FormItem"
              x-decorator-props={{
                asterisk: true,
                feedbackLayout: 'none',
              }}
              x-component="Select.Object"
              x-reactions={[]}
              x-component-props={{
                style: {
                  width: 100,
                },
                fieldNames: {
                  label: 'title',
                  value: 'name',
                }
              }}
              enum={columns.map((column) => column.toJSON())}
            />
            <SchemaField.String
              name="operation"
              x-decorator="FormItem"
              x-decorator-props={{
                asterisk: true,
                feedbackLayout: 'none',
              }}
              x-component="Select.Object"
              x-component-props={{
                style: {
                  width: 100,
                },
              }}
              enum={[]}
            />
            <SchemaField.String
              name="value"
              x-decorator="FormItem"
              x-decorator-props={{
                asterisk: true,
                feedbackLayout: 'none',
              }}
              x-component="Input"
            />
            <SchemaField.Void x-component="Remove" />
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
};

export default FilterItem;
