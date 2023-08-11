import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import _ from 'lodash';
import { useEffect } from 'react';
import { DEBOUNCE_WAIT, useLocalVariables, useVariables } from '../../../../variables';
import { getPath } from '../../../../variables/VariablesProvider';
import { isVariable } from '../../../common/utils/uitls';
import { useCompile } from '../../../hooks';

const useParseDefaultValue = () => {
  const field = useField<Field>();
  const schema = useFieldSchema();
  const variables = useVariables();
  const compile = useCompile({ noCache: true });
  const localVariables = useLocalVariables();

  useEffect(() => {
    const formVariable = localVariables.find((item) => item.name === '$form');
    const _run = async () => {
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (isVariable(schema.default) && variables && field) {
        // 一个变量字符串如果显示出来会比较奇怪
        if (isVariable(field.value)) {
          field.setValue(null);
        }

        field.loading = true;

        let value = await variables.parseVariable(schema.default, localVariables);
        if (Array.isArray(value)) {
          const collectionField = await variables.getCollectionField(schema.default);
          const isDate = collectionField?.uiSchema?.['x-component'] === 'DatePicker';
          if (isDate) {
            value = value.filter(Boolean)[0];
          } else if (!collectionField?.target) {
            value = value.filter(Boolean).join(',');
          }
        }

        field.setInitialValue(value);
        if (value == null || value === '') {
          field.reset();
        }
        field.loading = false;
      } else if (field.setInitialValue) {
        field.setInitialValue(compile(schema.default));
      }
    };
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    _run();

    // 实现联动的效果，当依赖的变量变化时（如 `$form` 变量），重新解析默认值
    const dispose = reaction(() => {
      if (isVariable(schema.default)) {
        return _.get({ $form: formVariable?.ctx }, getPath(schema.default));
      }
    }, run);

    return dispose;
  }, [schema.default]);
};

export default useParseDefaultValue;
