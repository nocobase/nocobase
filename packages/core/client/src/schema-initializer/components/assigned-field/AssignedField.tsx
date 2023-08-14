import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useEffect, useMemo } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { CollectionFieldProvider, useCollection, useCollectionField } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';
import { useCompile, useComponent } from '../../../schema-component';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import { useLocalVariables, useVariables } from '../../../variables';
import { DeletedField } from '../DeletedField';

interface AssignedFieldProps {
  value: any;
  onChange: (value: any) => void;
}

const InternalField: React.FC = (props) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema } = useCollectionField();
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

  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    // if (!field.validator && uiSchema['x-validator']) {
    //   field.validator = uiSchema['x-validator'];
    // }
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
    field.componentProps = componentProps;
    // field.component = [component, componentProps];
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  return React.createElement(component, props, props.children);
};

const CollectionField = (props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name} fallback={<DeletedField />}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
};

export enum AssignedFieldValueType {
  ConstantValue = 'constantValue',
  DynamicValue = 'dynamicValue',
}

export const AssignedField = (props: AssignedFieldProps) => {
  const { value, onChange } = props;
  const { name, getField } = useCollection();
  const { form } = useFormBlockContext();
  const fieldSchema = useFieldSchema();
  const record = useRecord();
  const variables = useVariables();
  const localVariables = useLocalVariables();

  const collectionField = getField(fieldSchema.name);

  const shouldChange = useMemo(
    () => getShouldChange({ collectionField, variables, localVariables }),
    [collectionField, localVariables, variables],
  );
  return (
    <VariableInput
      form={form}
      record={record}
      value={value}
      onChange={onChange}
      blockCollectionName={name}
      renderSchemaComponent={CollectionField}
      collectionField={collectionField}
      shouldChange={shouldChange}
    />
  );
};
