import { onFormValuesChange } from '@formily/core';
import { useField, useFieldSchema, useForm, useFormEffects } from '@formily/react';
import evaluators, { Evaluator } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useCollection } from '@nocobase/client';

const ReadPretty = (props) => {
  if (props?.options?.dataType !== 'string') {
    return <div>{toFixedByStep(props.value, props.step)}</div>;
  }
  return <div>{props.value}</div>;
};

const Input = (props) => {
  const { options } = props;
  const { dataType, expression, engine = 'math.js' } = options;
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const form = useForm();
  const val = () => {
    const scope = cloneDeep(form.values);
    try {
      return evaluate(expression, scope);
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
  if (dataType === 'double') {
    return <div>{toFixedByStep(value, props.step)}</div>;
  }
  return <div>{value}</div>;
};

export const Result = (props: any) => {
  const field = useField();
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name as string);
  return field.readPretty ? <ReadPretty {...props} options={options} /> : <Input {...props} options={options} />;
};

export default Result;
