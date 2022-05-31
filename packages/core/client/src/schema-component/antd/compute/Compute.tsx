import { onFormValuesChange } from '@formily/core';
import { connect, mapReadPretty, useFormEffects } from '@formily/react';
import { InputNumber } from 'antd';
import React, { useState } from 'react';
import * as math from 'mathjs';
import _ from 'lodash';
import { ReadPretty } from '../input-number/ReadPretty';

const AntdCompute = (props) => {
  const { value, onChange, expression } = props;
  const [computeValue, setComputeValue] = useState(value);

  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = _.cloneDeep(form.values);
      let result;
      try {
        result = math.evaluate(expression, scope);
      } catch {}
      if (result) {
        setComputeValue(result);
        if (onChange) {
          onChange(result);
        }
      }
    })
  })
  
  return (
    <InputNumber readOnly value={computeValue} />
  );
}

export const Compute = connect(
  AntdCompute,
  mapReadPretty(ReadPretty)
);

export default Compute;