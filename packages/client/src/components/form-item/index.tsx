import React from 'react';
import { BlockItem } from '../block-item';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { CollectionFieldProvider, useCollectionField, useFieldProps, useAttach } from '..';
import { useField, useFieldSchema, useForm } from '@formily/react';

const InternalFormItem = (props) => {
  const { fieldSchema } = useCollectionField();
  const fieldProps = useFieldProps(fieldSchema);
  const currentField = useField();
  const form = useForm();
  const field = useAttach(form.createField({ ...fieldProps }));
  return <FormilyFormItem {...props} />;
};

export const FormItem: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <BlockItem className={'nb-form-item'}>
        <InternalFormItem {...props} />
      </BlockItem>
    </CollectionFieldProvider>
  );
};
