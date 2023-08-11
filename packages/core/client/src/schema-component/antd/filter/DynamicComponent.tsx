import { createForm, onFieldValueChange } from '@formily/core';
import { FieldContext, FormContext } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useContext, useMemo } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';
import { SchemaComponent } from '../../core';
import { useComponent } from '../../hooks';
import { FilterContext } from './context';

export interface DynamicComponentProps {
  value: any;
  collectionField: CollectionFieldOptions;
  onChange: (value: any) => void;
  renderSchemaComponent: () => React.JSX.Element;
}

interface Props {
  schema: any;
  value: any;
  collectionField: CollectionFieldOptions;
  onChange: (value: any) => void;
}

export const DynamicComponent = (props: Props) => {
  const { dynamicComponent, disabled } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      disabled,
      effects() {
        onFieldValueChange('value', (field) => {
          props?.onChange?.(field.value);
        });
      },
    });
  }, [JSON.stringify(props.value)]);
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
        />
      </FieldContext.Provider>
    );
  };
  return (
    <FormContext.Provider value={form}>
      {component
        ? React.createElement<DynamicComponentProps>(component, {
            value: props.value,
            collectionField: props.collectionField,
            onChange: props?.onChange,
            renderSchemaComponent,
          })
        : renderSchemaComponent()}
    </FormContext.Provider>
  );
};
