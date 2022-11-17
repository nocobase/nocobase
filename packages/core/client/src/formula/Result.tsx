import { onFormValuesChange } from '@formily/core';
import { useFieldSchema, useFormEffects } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { InputNumber } from 'antd';
import _ from 'lodash';
import * as math from 'mathjs';
import React from 'react';

const Result = (props) => {
  const { onChange, ...others } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name as string);
  const { expression } = options;

  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = _.cloneDeep(form.values);
      let result;
      try {
        result = math.evaluate(expression, scope);
        result = Number.isFinite(result) ? math.round(result, 9) : null;
      } catch{}
      if (onChange) {
        onChange(result);
      }
    });
  });

  return <InputNumber {...others} readOnly stringMode={true} />;
};

export default Result;
