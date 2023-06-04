import { onFormValuesChange } from '@formily/core';
import { useFieldSchema, useFormEffects, useForm } from '@formily/react';
import { Checkbox, DatePicker, InputNumber, Input as InputString, useCollection, useCollectionManager } from '@nocobase/client';
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

function useTargetCollectionField() {
  const fieldSchema = useFieldSchema();
  const providedCollection = useCollection();
  const { getCollection, getCollectionField } = useCollectionManager();
  const paths = (fieldSchema.name as string).split('.');
  let collection = providedCollection;
  for (let i = 0; i < paths.length - 1; i++) {
    const field = collection.getField(paths[i]);
    collection = getCollection(field.target);
  }
  return getCollectionField(`${collection.name}.${paths[paths.length - 1]}`);
}

export const Result = (props) => {
  const { value, ...others } = props;
  const fieldSchema = useFieldSchema();
  const { name, dataType, expression, engine = 'math.js' } = useTargetCollectionField() ?? {};
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  useFormEffects(() => {
    onFormValuesChange((form) => {
      if ((fieldSchema.name as string).indexOf('.') >= 0) {
        return;
      }
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
      form.setValuesIn(name, v);
    });
  });
  const Component = TypedComponents[dataType] ?? InputString;
  return <Component {...others} value={dataType === 'double' ? toFixedByStep(value, props.step) : value} />;
};

export default Result;
