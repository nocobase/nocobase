import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { useVariables } from '../../../../variables';
import { isVariable } from '../../../common/utils/uitls';

const useParseDefaultValue = () => {
  const field = useField<Field>();
  const schema = useFieldSchema();
  const variables = useVariables();

  useEffect(() => {
    const run = async () => {
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (isVariable(schema.default) && variables && field.setInitialValue) {
        field.setInitialValue(' ');
        field.loading = true;

        let value = await variables.parseVariable(schema.default);
        if (Array.isArray(value)) {
          const collectionField = variables.getCollectionField(schema.default);
          if (collectionField?.uiSchema?.['x-component'] === 'DatePicker') {
            value = value.filter(Boolean)[0];
          } else if (!collectionField?.target) {
            value = value.filter(Boolean).join(',');
          }
        }

        field.setInitialValue(value);
        field.loading = false;
      } else if (field.setInitialValue) {
        field.setInitialValue(schema.default);
      }
    };

    run();
  }, [schema.default]);
};

export default useParseDefaultValue;
