import { CloseCircleOutlined } from '@ant-design/icons';
import { FormItem as FormilyFormItem, FormLayout, Space as AntdSpace } from '@formily/antd';
import { createForm, onFieldReact, onFieldValueChange, onFormValuesChange } from '@formily/core';
import { Field } from '@formily/core/esm/models/Field';
import { Form } from '@formily/core/esm/models/Form';
import {
  FieldContext,
  FormContext,
  ISchema,
  Schema,
  SchemaKey,
  SchemaOptionsContext,
  useFieldSchema,
} from '@formily/react';
import { isValid, uid } from '@formily/shared';
import { get } from 'lodash';
import React, { useContext, useMemo } from 'react';
import { SchemaComponent } from '../../components';

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
    const operations = column?.['x-component-props']?.['operations'] || [];
    if (!nested) {
      return {
        column,
        operations,
      };
    }
    if (Object.keys(nested).length === 0) {
      return {
        column,
        operations,
      };
    }
    const operationValue = Object.keys(nested).shift();
    console.log('toValues', { operationValue });
    const operation = operations.find((operation) => operation.value === operationValue);
    console.log('toValues', { operation });
    if (!operation) {
      return {
        operations,
        column,
      };
    }
    if (operation.noValue) {
      return {
        column,
        operations,
        operation,
      };
    }
    return {
      column,
      operation,
      operations,
      value: nested[operationValue],
    };
  };

  const values = toValues(value);

  console.log('toValues', values, value);

  const Remove = (props) => {
    return (
      onRemove && (
        <a onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )
    );
  };

  const form = useMemo(
    () =>
      createForm({
        initialValues: values,
        effects: (form) => {
          onFieldValueChange('column', (field: Field, form: Form) => {
            const column = (field.value || {}) as ISchema;
            const operations = column?.['x-component-props']?.['operations'] || [];
            field.query('operation').take((f: Field) => {
              f.setDataSource(operations);
              f.value = get(operations, [0]);
            });
            field.query('value').take((f: Field) => {
              f.value = undefined;
              f.componentProps.schema = column;
            });
          });
          onFieldReact('operation', (field: Field) => {
            console.log('operation', field.value);
            const operation = field.value || {};
            field.query('value').take((f: Field) => {
              f.visible = !operation.noValue;
              if (operation.noValue) {
                f.value = undefined;
              }
              f.componentProps.operation = operation;
            });
          });
          onFormValuesChange((form) => {
            const { column, operation, value } = form?.values || {};

            if (!operation?.value) {
              return;
            }
            const fieldName = Object.keys(column.properties).shift();
            if (operation?.noValue) {
              onChange({
                [fieldName]: {
                  [operation.value]: true,
                },
              });
            } else {
              onChange(
                isValid(value)
                  ? {
                      [fieldName]: {
                        [operation.value]: value,
                      },
                    }
                  : {},
              );
            }
            console.log('form.values', form.values);
          });
        },
      }),
    [],
  );

  const columnEnum: any = [...columns.values()].map((column) => column.toJSON());
  const schema: ISchema = {
    type: 'void',
    properties: {
      space: {
        type: 'void',
        'x-component': 'AntdSpace',
        properties: {
          column: {
            type: 'object',
            name: 'column',
            'x-decorator': 'FormilyFormItem',
            'x-decorator-props': {
              asterisk: true,
              feedbackLayout: 'none',
            },
            'x-component': 'Select',
            'x-component-props': {
              objectValue: true,
              style: {
                width: 100,
              },
              fieldNames: {
                label: 'title',
                value: 'name',
                options: 'options',
              },
              options: columnEnum,
            },
            enum: columnEnum,
          },
          operation: {
            type: 'object',
            name: 'operation',
            'x-decorator': 'FormilyFormItem',
            'x-decorator-props': {
              asterisk: true,
              feedbackLayout: 'none',
            },
            'x-component': 'Select',
            'x-component-props': {
              objectValue: true,
              style: {
                width: 100,
              },
              fieldNames: {
                label: 'label',
                value: 'value',
                options: 'options',
              },
              options: values.operations,
            },
            enum: values.operations,
          },
          value: {
            type: 'object',
            name: 'value',
            'x-decorator': 'FormilyFormItem',
            'x-decorator-props': {
              asterisk: true,
              feedbackLayout: 'none',
            },
            'x-component': 'Filter.DynamicValue',
            'x-component-props': {
              schema: values.column,
              operation: values.operation,
            },
          },
          [uid()]: {
            type: 'void',
            'x-component': 'Remove',
          },
        },
      },
    },
  };

  return (
    <FieldContext.Provider value={null}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'inline'}>
          <SchemaComponent schema={schema} components={{ AntdSpace, FormilyFormItem, Remove }}></SchemaComponent>
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

export default FilterItem;
