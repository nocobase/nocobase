import { onFormValuesChange } from '@formily/core';
import { useFieldSchema, useFormEffects, useForm } from '@formily/react';
import { Checkbox, DatePicker, InputNumber, Input as InputString, useCollection } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';

import { toDbType } from '../../../utils';

const TypedComponents = {
  boolean: Checkbox,
  integer: InputNumber,
  bigInt: InputNumber,
  double: InputNumber,
  decimal: InputNumber,
  date: DatePicker,
  string: InputString,
};

export const Result = (props) => {
  const { value, ...others } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name as string);
  const { dataType, expression, engine = 'math.js' } = options || {};
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = cloneDeep(form.values);
      let v;
      try {
        v = evaluate(expression, scope);
        v = toDbType(v, dataType);
      } catch (error) {
        v = null;
      }
      if ((v == null && value == null) || JSON.stringify(v) === JSON.stringify(value)) {
        return;
      }
      // console.log(options.name, v, value, props.defaultValue);
      form.setValuesIn(options.name, v);
    });
  });
  const Component = TypedComponents[dataType] ?? InputString;
  return <Component {...others} value={dataType === 'double' ? toFixedByStep(value, props.step) : value} />;
};

Result.ReadPretty = function ReadPretty(props) {
  return props.value ?? null;
};

export default Result;
