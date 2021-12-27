import React, { useContext, useEffect } from 'react';
import { BlockItem } from '../block-item';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { connect, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import { useCollectionField } from './hooks';
import { CollectionFieldProvider } from './CollectionFieldProvider';
import { Field, FormPath } from '@formily/core';

// TODO: 初步适配
const InternalFormItem = (props) => {
  const fieldSchema = useFieldSchema();
  const { uiSchema } = useCollectionField();
  const field = useField<Field>();
  const options = useContext(SchemaOptionsContext);
  const component = FormPath.getIn(options?.components, uiSchema['x-component']);
  const setFieldProps = (key, value) => {
    field[key] = typeof field[key] === 'undefined' ? value : field[key];
  };
  const setRequired = () => {
    if (typeof fieldSchema['required'] === 'undefined') {
      field.required = !!uiSchema['required'];
    }
  };
  useEffect(() => {
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    setRequired();
    field.component = [component, uiSchema['x-component-props']];
  }, [uiSchema.title, uiSchema.description, uiSchema.required]);
  return <FormilyFormItem {...props} />;
};

// TODO: 初步适配
const InternalField: React.FC = (props) => {
  const { uiSchema } = useCollectionField();
  const options = useContext(SchemaOptionsContext);
  const component = FormPath.getIn(options?.components, uiSchema['x-component']);
  return React.createElement(component, props);
};

export const Collection = () => null;

Collection.FormItem = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <BlockItem className={'nb-form-item'}>
        <InternalFormItem {...props} />
      </BlockItem>
    </CollectionFieldProvider>
  );
});

Collection.Field = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export default Collection;
