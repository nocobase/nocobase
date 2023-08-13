import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { useEffect } from 'react';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';

/**
 * 用于懒加载 Form 区块中只用于展示的关联字段的值
 */
const useLazyLoadAssociationField = () => {
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const form = useForm();
  const schema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();

  const schemaName = schema.name.toString();

  useEffect(() => {
    if (!schemaName.includes('.') || !variables || name === 'fields') {
      return;
    }

    const formVariable = {
      name: '$form',
      ctx: form.values,
      collectionName: name,
    };
    const variableString = `{{ $form.${schemaName} }}`;
    const collectionField = getCollectionJoinField(`${name}.${schemaName}`);

    if (process.env.NODE_ENV !== 'production') {
      if (!collectionField) {
        throw new Error(`useLazyLoadAssociationField: ${schemaName} not found in collection ${name}`);
      }
    }

    variables
      .parseVariable(variableString, formVariable)
      .then((value) => {
        field.value = transformVariableValue(value, { targetCollectionFiled: collectionField });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [schemaName.includes('.') ? form.values[schemaName.split('.')[0]] : null]);
};

export default useLazyLoadAssociationField;
