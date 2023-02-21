import { onFormValuesChange } from '@formily/core';
import { useField, useFieldSchema, useForm, useFormEffects } from '@formily/react';
import evaluators, { Evaluator } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { Checkbox, DatePicker, Input as InputString, InputNumber, useCollection } from '@nocobase/client';

const TypedComponents = {
  boolean: Checkbox,
  integer: InputNumber,
  bigInt: InputNumber,
  double: InputNumber,
  decimal: InputNumber,
  date: DatePicker,
  string: InputString,
};

const ReadPretty = (props) => {
  const { dataType } = props?.options?? {};
  const Component = TypedComponents[dataType] ?? InputString;
  return <Component {...props} />;
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
