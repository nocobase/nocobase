import { css } from '@emotion/css';
import { createForm, onFieldValueChange } from '@formily/core';
import { connect, FieldContext, FormContext } from '@formily/react';
import { merge } from '@formily/shared';
import { Cascader } from 'antd';
import React, { useContext, useMemo } from 'react';
import { SchemaComponent } from '../../core';
import { useCompile, useComponent } from '../../hooks';
import { FilterContext } from './context';
import { useFilterOptions } from './useFilterActionProps';

const VariableCascader = connect((props) => {
  const fields = useFilterOptions('users');
  const compile = useCompile();
  const { value, onChange } = props;
  return (
    <Cascader
      className={css`
        width: 160px;
      `}
      value={value ? value.split('.') : []}
      fieldNames={{
        label: 'title',
        value: 'name',
        children: 'children',
      }}
      onChange={(value) => {
        onChange(value ? value.join('.') : null);
      }}
      options={compile([
        {
          title: '{{t("Current user")}}',
          name: 'currentUser',
          children: fields
            .filter((field) => {
              if (!field.target) {
                return true;
              }
              return field.type === 'belongsTo';
            })
            .map((field) => {
              if (field.children) {
                field.children = field.children.filter((child) => {
                  return !child.target;
                });
              }
              return field;
            }),
        },
      ])}
    />
  );
});

export const DynamicComponent = (props) => {
  const { dynamicComponent } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      effects() {
        onFieldValueChange('value', (field) => {
          props?.onChange?.(field.value);
        });
      },
    });
  }, [JSON.stringify(props.schema), JSON.stringify(props.value)]);
  const renderSchemaComponent = () => {
    return (
      <FieldContext.Provider value={null}>
        <SchemaComponent
          schema={{
            'x-component': 'Input',
            ...props.schema,
            'x-component-props': merge(props?.schema?.['x-component-props'] || {}, {
              style: {
                minWidth: 150,
              },
            }),
            name: 'value',
            'x-read-pretty': false,
            'x-validator': undefined,
            'x-decorator': undefined,
          }}
          components={{
            VariableCascader,
          }}
        />
      </FieldContext.Provider>
    );
  };
  return (
    <FormContext.Provider value={form}>
      {component
        ? React.createElement(component, {
            value: props.value,
            onChange: props?.onChange,
            renderSchemaComponent,
          })
        : renderSchemaComponent()}
    </FormContext.Provider>
  );
};
