import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { useEffect } from 'react';
import { useCollection } from '../../../../collection-manager';
import { useVariables } from '../../../../variables';

const useLazyLoadAssociationField = () => {
  const { name } = useCollection();
  const form = useForm();
  const schema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();

  const schemaName = schema.name.toString();

  useEffect(() => {
    if (!schemaName.includes('.') || !variables) {
      return;
    }

    const formVariable = {
      name: '$form',
      ctx: form.values,
      collectionName: name,
    };
    const variableString = `{{ $form.${schemaName} }}`;
    variables
      .parseVariable(variableString, formVariable)
      .then((value) => {
        field.value = value;
      })
      .catch((err) => {
        console.error(err);
      });
  }, [schemaName.includes('.') ? form.values[schemaName.split('.')[0]] : null]);
};

export default useLazyLoadAssociationField;
