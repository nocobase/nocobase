import React, { useState } from 'react';
import { onFormValuesChange } from '@formily/core';
import { toJS } from '@formily/reactive';
import { useFieldSchema, useFormEffects, useForm } from '@formily/react';
import {
  Checkbox,
  DatePicker,
  InputNumber,
  Input as InputString,
  useCollection,
  useCollectionManager,
  useFormBlockContext,
} from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';

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

export function Result(props) {
  const { value, ...others } = props;
  const fieldSchema = useFieldSchema();
  const { dataType, expression, engine = 'math.js' } = useTargetCollectionField() ?? {};
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const formBlockContext = useFormBlockContext();
  useFormEffects(() => {
    onFormValuesChange((form) => {
      if (
        (fieldSchema.name as string).indexOf('.') >= 0 ||
        !formBlockContext?.form ||
        formBlockContext.form?.readPretty
      ) {
        return;
      }
      const scope = toJS(form.values);
      let v;
      try {
        v = evaluate(expression, scope);
        v = toDbType(v, dataType);
      } catch (error) {
        v = null;
      }
      if ((v == null && editingValue == null) || JSON.stringify(v) === JSON.stringify(editingValue)) {
        return;
      }
      setEditingValue(v);
    });
  });
  const Component = TypedComponents[dataType] ?? InputString;
  return (
    <Component {...others} value={dataType === 'double' ? toFixedByStep(editingValue, props.step) : editingValue} />
  );
}

export default Result;
