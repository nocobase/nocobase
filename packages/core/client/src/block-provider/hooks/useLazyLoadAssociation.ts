import { Form, onFormValuesChange } from '@formily/core';
import { useEffect } from 'react';
import { useCollection } from '../../collection-manager';
import { useVariables } from '../../variables';
import { VariableOption } from '../../variables/types';

/**
 * TODO: 暂时没有用到，可能以后会用到
 * 懒加载表单空缺的关系字段
 * @param form
 */
const useLazyLoadAssociation = (form: Form) => {
  const { name } = useCollection();
  const variables = useVariables();
  const formVariable: VariableOption = {
    name: '$form',
    ctx: form.values,
    collectionName: name,
  };

  useEffect(() => {
    Object.keys(form.values).forEach(async (key) => {
      if (key.includes('.')) {
        const variableString = `{{ $form.${key} }}`;
        const value = await variables.parseVariable(variableString, formVariable);
        form.values[key] = value;
      }
    });
  }, []);

  form.addEffects('test', () => {
    onFormValuesChange((form) => {
      Object.keys(form.values).forEach(async (key) => {
        if (key.includes('.')) {
          const variableString = `{{ $form.${key} }}`;
          const value = await variables.parseVariable(variableString, formVariable);
          form.values[key] = value;
        }
      });
    });
  });
};

export default useLazyLoadAssociation;
