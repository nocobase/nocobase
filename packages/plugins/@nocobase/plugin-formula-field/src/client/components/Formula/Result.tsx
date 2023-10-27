import { onFormValuesChange } from '@formily/core';
import { useField, useFieldSchema, useFormEffects } from '@formily/react';
import { toJS } from '@formily/reactive';
import type { CollectionOptions } from '@nocobase/client';
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
import React, { useEffect, useState } from 'react';

import { toDbType } from '../../../utils';

const TypedComponents = {
  boolean: Checkbox.ReadPretty,
  integer: InputNumber.ReadPretty,
  bigInt: InputNumber.ReadPretty,
  double: InputNumber.ReadPretty,
  decimal: InputNumber.ReadPretty,
  date: DatePicker.ReadPretty,
  string: InputString.ReadPretty,
};

function useTargetCollectionField() {
  const fieldSchema = useFieldSchema();
  const providedCollection = useCollection();
  const { getCollection, getCollectionField } = useCollectionManager();
  const paths = (fieldSchema.name as string).split('.');
  let collection: CollectionOptions = providedCollection;
  for (let i = 0; i < paths.length - 1; i++) {
    const field = collection.getField(paths[i]);
    collection = getCollection(field.target);
  }
  return getCollectionField(`${collection.name}.${paths[paths.length - 1]}`);
}

function getValuesByPath(data, path) {
  const keys = path.split('.');
  let current = data;

  for (const key of keys) {
    if (current && typeof current === 'object') {
      if (Array.isArray(current) && !isNaN(key)) {
        const index = parseInt(key);
        if (index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return data;
        }
      } else if (key in current) {
        current = current[key];
      } else {
        return data;
      }
    } else {
      return data;
    }
  }

  return current;
}

export function Result(props) {
  const { value, ...others } = props;
  const fieldSchema = useFieldSchema();
  const { dataType, expression, engine = 'math.js' } = useTargetCollectionField() ?? {};
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const formBlockContext = useFormBlockContext();
  const field = useField();
  const path: any = field.path.entire;
  const fieldPath = path?.replace(`.${fieldSchema.name}`, '');

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  useFormEffects(() => {
    onFormValuesChange((form) => {
      if (
        (fieldSchema.name as string).indexOf('.') >= 0 ||
        !formBlockContext?.form ||
        formBlockContext.form?.readPretty
      ) {
        return;
      }

      const scope = toJS(getValuesByPath(form.values, fieldPath));
      let v;
      try {
        v = evaluate(expression, scope);
        v = toDbType(v, dataType);
      } catch (error) {
        v = null;
      }
      if (v == null && editingValue == null) {
        setEditingValue(v);
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
