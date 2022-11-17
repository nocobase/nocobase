import { onFormValuesChange } from '@formily/core';
import { useFieldSchema, useFormEffects } from '@formily/react';
import { Input, InputNumber } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import * as math from 'mathjs';
import { isNumber } from 'mathjs';
import React from 'react';
import { useCollection } from '../collection-manager';

export const Result = (props) => {
  const { onChange, evaluate, ...others } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name as string);
  const { expression } = options;

  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = cloneDeep(form.values);
      let result;
      try {
        result = evaluate(expression, scope);
        result = Number.isFinite(result) ? math.round(result, 9) : null;
      } catch {}
      if (onChange) {
        onChange(result);
      }
    });
  });

  if (isNumber(props.value)) {
    return <InputNumber {...others} disabled stringMode={true} />;
  }

  return <Input {...others} disabled />;
};

export default Result;
