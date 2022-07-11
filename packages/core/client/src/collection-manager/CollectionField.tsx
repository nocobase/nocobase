import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useEffect } from 'react';
import { useCompile, useComponent, useFormBlockContext } from '..';
import { CollectionFieldProvider } from './CollectionFieldProvider';
import { useCollectionField } from './hooks';
import { concat } from 'lodash';

// TODO: 初步适配
const InternalField: React.FC = (props) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { name, interface: interfaceType, uiSchema } = useCollectionField();
  const component = useComponent(uiSchema?.['x-component']);
  const compile = useCompile();
  const setFieldProps = (key, value) => {
    field[key] = typeof field[key] === 'undefined' ? value : field[key];
  };
  const setRequired = () => {
    if (typeof fieldSchema['required'] === 'undefined') {
      field.required = !!uiSchema['required'];
    }
  };
  const ctx = useFormBlockContext();

  useEffect(() => {
    if (ctx?.field) {
      ctx.field.added = ctx.field.added || new Set();
      ctx.field.added.add(fieldSchema.name);
    }
  });
  // TODO: 初步适配
  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    if (!field.validator && (uiSchema['x-validator'] || fieldSchema['x-validator'])) {
      const concatSchema = concat([], uiSchema['x-validator'] || [], fieldSchema['x-validator'] || [])
      field.validator = concatSchema;
    }
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    if (fieldSchema['x-read-pretty'] === true) {
      field.readPretty = true;
    }
    setRequired();
    // @ts-ignore
    field.dataSource = uiSchema.enum;
    const originalProps = compile(uiSchema['x-component-props']) || {};
    const componentProps = merge(originalProps, field.componentProps || {});
    field.component = [component, componentProps];

    // if (interfaceType === 'input') {
    //   field.componentProps.ellipsis = true;
    // } else if (interfaceType === 'textarea') {
    //   field.componentProps.ellipsis = true;
    // } else if (interfaceType === 'markdown') {
    //   field.componentProps.ellipsis = true;
    // } else if (interfaceType === 'attachment') {
    //   field.componentProps.size = 'small';
    // }
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  
  return React.createElement(component, props, props.children);
};

export const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  const field = fieldSchema?.['x-component-props']?.['field'];
  return (
    <CollectionFieldProvider name={fieldSchema.name} field={field}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export default CollectionField;
