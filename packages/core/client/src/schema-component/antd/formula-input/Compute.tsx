import { onFormValuesChange } from '@formily/core';
import { connect, mapReadPretty, useFieldSchema, useFormEffects } from '@formily/react';
import { InputNumber } from 'antd';
import _ from 'lodash';
import * as math from 'mathjs';
import React from 'react';
import { useCollection } from '../../../collection-manager/hooks';
import { ReadPretty } from '../input-number/ReadPretty';

const AntdCompute = (props) => {
  const { onChange, ...others } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name);
  const { expression } = options;

  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = _.cloneDeep(form.values);
      let result;
      try {
        result = math.evaluate(expression, scope);
        result = math.round(result, 9);
      } catch {}
      if (onChange) {
        onChange(result);
      }
    })
  })
  
  return (
    <InputNumber {...others} readOnly stringMode={true} />
  );
}

export const Compute = connect(
  AntdCompute,
  mapReadPretty(ReadPretty)
);

export default Compute;