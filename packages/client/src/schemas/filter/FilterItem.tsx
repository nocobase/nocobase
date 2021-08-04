import React, { useContext, useMemo, useState } from 'react';
import { SchemaField } from '..';
import { createForm, onFieldChange, onFieldReact, onFormValuesChange } from '@formily/core';
import { FormProvider, FormConsumer, useFieldSchema, Schema, SchemaOptionsContext, ISchema, SchemaKey } from '@formily/react';
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
import { isValid } from '@formily/shared';

function useFilterColumns(): Map<SchemaKey, Schema> {
  const schema = useFieldSchema();
  const columns = schema.reduceProperties((columns, current) => {
    if (current['x-component'] === 'Filter.Column') {
      const fieldName = Object.keys(current.properties).shift();
      columns.set(fieldName, current);
      return columns;
    }
    return columns;
  }, new Map<SchemaKey, Schema>());
  return columns;
}

export const FilterItem = (props) => {
  const { value, initialValues = {}, onRemove, onChange } = props;
  const options = useContext(SchemaOptionsContext);
  const columns = useFilterColumns();
  console.log('FilterItem', value)

  const toValues = (value) => {
    if (!value) {
      return {};
    }
    if (Object.keys(value).length === 0) {
      return {};
    }
    const fieldName = Object.keys(value).shift();
    const nested = value[fieldName];
    const column = columns.get(fieldName).toJSON();
    if (!nested) {
      return {
        column,
      }
    }
    if (Object.keys(nested).length === 0) {
      return {
        column,
      }
    }
    const operationValue = Object.keys(nested).shift();
    console.log('toValues', {operationValue});
    const operations = column?.['x-component-props']?.['operations']||[];
    const operation = operations.find(operation => operation.value === operationValue);
    console.log('toValues', {operation});
    if (!operation) {
      return {
        column,
      }
    }
    if (operation.noValue) {
      return {
        column,
        operation,
      }
    }
    return {
      column,
      operation,
      value: nested[operationValue],
    }
  }

  const values = toValues(value);

  // console.log('toValues', values, value);

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
        initialValues: values,
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
          onFormValuesChange((form) => {
            const { column, operation, value } = form.values;
            if (!operation?.value) {
              return;
            }
            const fieldName = Object.keys(column.properties).shift();
            if (operation?.noValue) {
              onChange({[fieldName]: {
                [operation.value]: true,
              }});
            } else if (isValid(value)) {
              onChange({[fieldName]: {
                [operation.value]: value,
              }});
            }
            console.log('form.values', form.values);
          })
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
              x-decorator="FormilyFormItem"
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
              enum={[...columns.values()].map((column) => column.toJSON())}
            />
            <SchemaField.String
              name="operation"
              x-decorator="FormilyFormItem"
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
              x-decorator="FormilyFormItem"
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
