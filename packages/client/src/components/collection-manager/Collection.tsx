import React, { useContext } from 'react';
import { BlockItem } from '../block-item';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { useFieldProps, useAttach } from '../schema-component';
import { connect, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import { useCollectionField } from './hooks';
import { CollectionFieldProvider } from './CollectionFieldProvider';
import { FormPath } from '@formily/core';

const InternalFormItem = (props) => {
  const { fieldSchema } = useCollectionField();
  console.log('fieldSchema', fieldSchema);
  const fieldProps = useFieldProps(fieldSchema);
  const currentField = useField();
  const form = useForm();
  const field = useAttach(
    form.createField({ ...fieldProps, basePath: currentField.props.basePath, name: currentField.props.name }),
  );
  console.log('fieldProps', field);
  return <FormilyFormItem {...props} />;
};

const InternalField: React.FC = (props) => {
  const { fieldSchema } = useCollectionField();
  const options = useContext(SchemaOptionsContext);
  const component = FormPath.getIn(options?.components, fieldSchema['x-component']);
  return React.createElement(component, props);
};

export const Collection = () => null;

Collection.FormItem = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name} uiSchema={fieldSchema.toJSON()}>
      <BlockItem className={'nb-form-item'}>
        <InternalFormItem {...props} />
      </BlockItem>
    </CollectionFieldProvider>
  );
});

Collection.Field = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name} uiSchema={fieldSchema.toJSON()}>
      {/* <InternalField {...props} /> */}
    </CollectionFieldProvider>
  );
});

export default Collection;
