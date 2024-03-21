import { onFormValuesChange } from '@formily/core';
import { useField, useFieldSchema, useForm, useFormEffects } from '@formily/react';
import { toFixedByStep } from '@nocobase/utils/client';
import cloneDeep from 'lodash/cloneDeep';
import * as math from 'mathjs';
import { isNumber } from 'mathjs';
import React, { useState } from 'react';
import { useCollection_deprecated } from '../collection-manager';

const ReadPretty = (props) => {
  if (props?.options?.dataType !== 'string') {
    return <div>{toFixedByStep(props.value, props.step)}</div>;
  }
  return <div>{props.value}</div>;
};

const Input = (props) => {
  const { evaluate, options } = props;
  const { dataType, expression } = options;
  const form = useForm();
  const val = () => {
    const scope = cloneDeep(form.values);
    try {
      let result = evaluate(expression, scope);
      result = isNumber(result) && Number.isFinite(result) ? math.round(result, 9) : result;
      return result;
    } catch (error) {
      return null;
    }
  };
  const [value, setVal] = useState(() => {
    return val();
  });
  useFormEffects(() => {
    onFormValuesChange(() => {
      setVal(val());
    });
  });
  if (dataType !== 'string') {
    return <div>{toFixedByStep(value, props.step)}</div>;
  }
  return <div>{value}</div>;
};

export const Result = (props: any) => {
  const field = useField();
  const { getField } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name as string);
  return field.readPretty ? <ReadPretty {...props} options={options} /> : <Input {...props} options={options} />;
};

export default Result;
