import React, { useState } from 'react';
import { useFieldSchema, useField, useForm, RecursionField } from '@formily/react';
import { ActionContext } from '../';
import { CollectionProvider, SchemaComponentOptions } from '../../../';
import { useCreateActionProps as useCAP } from '../../../block-provider/hooks';

export const AssociationFieldAddNewer = (props) => {
  const { fieldNames } = props;
  const schema = useFieldSchema();
  const field = useField();
  const [visible, setVisible] = useState(false);
  const form = useForm();
  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField = useField();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data.data?.data;
        form.setValuesIn(field.props.name, {
          [fieldNames.label]: data[fieldNames.label],
          id: data.id,
          value: data.id,
        });
      },
    };
  };
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <CollectionProvider name={props.service.resource}>
        <SchemaComponentOptions scope={{ useCreateActionProps }}>
          <RecursionField schema={schema || ({} as any)} name={'addNew'} />
        </SchemaComponentOptions>
      </CollectionProvider>
    </ActionContext.Provider>
  );
};
