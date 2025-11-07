/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { onFormValuesChange } from '@formily/core';
import { useField, useFieldSchema, useFormEffects } from '@formily/react';
import { toJS } from '@formily/reactive';
import {
  Checkbox,
  DatePicker,
  InputNumber,
  Input as InputString,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useFormBlockContext,
} from '@nocobase/client';
import _ from 'lodash';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import React, { useEffect, useState, useContext } from 'react';

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

export function useTargetCollectionField(schema?) {
  const targetSchema = useFieldSchema();
  const fieldSchema = schema || targetSchema;
  const providedCollection = useCollection_deprecated();
  const { getCollection, getCollectionField } = useCollectionManager_deprecated();
  const paths = (fieldSchema?.name as string)?.split('.') || [];
  let collection: any = providedCollection;
  for (let i = 0; i < paths.length - 1; i++) {
    const field = collection.getField(paths[i]);
    collection = getCollection(field.target);
  }
  return getCollectionField(`${collection.name}.${paths[paths.length - 1]}`);
}
function getValuesByPath(values, key, index?) {
  const targetValue = values[key];
  if (Array.isArray(targetValue)) {
    return targetValue[index];
  }
  if (targetValue && typeof targetValue === 'object') {
    return targetValue;
  } else {
    return values;
  }
}

function getValuesByFullPath(values, fieldPath) {
  const fieldPaths = fieldPath.split('.');
  let currentKeyIndex = 0;
  let value = values;
  //loop to get the last field
  while (currentKeyIndex < fieldPaths.length) {
    const fieldName = fieldPaths[currentKeyIndex];
    const index = parseInt(fieldPaths?.[currentKeyIndex + 1]);
    value = getValuesByPath(value, fieldName, index);
    //have index means an array, then jump 2; else 1
    currentKeyIndex = currentKeyIndex + (index >= 0 ? 2 : 1);
  }
  return value;
}

function areValuesEqual(value1, value2) {
  if (_.isString(value1) && !isNaN(Date.parse(value1))) {
    value1 = new Date(value1);
  }

  if (_.isString(value2) && !isNaN(Date.parse(value2))) {
    value2 = new Date(value2);
  }

  if (_.isDate(value1) && _.isDate(value2)) {
    return value1.getTime() === value2.getTime();
  }

  return _.isEqual(value1, value2);
}

export function Result(props) {
  const { value, ...others } = props;
  const fieldSchema = useFieldSchema();
  const { dataType, expression, engine = 'math.js' } = useTargetCollectionField() ?? {};
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const formBlockContext = useFormBlockContext();
  const field: any = useField();
  const path: any = field?.path?.entire;
  const fieldPath = path?.replace(`.${fieldSchema.name}`, '');

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  useFormEffects(() => {
    onFormValuesChange((form) => {
      if (
        (fieldSchema.name as string).indexOf('.') >= 0 ||
        !formBlockContext?.form ||
        formBlockContext.form?.readPretty ||
        fieldSchema['x-decorator'] !== 'FormItem'
      ) {
        return;
      }
      //field name may be like todos.0.sub_todos.0.title
      //scope should be the deepest one
      const scope = toJS(getValuesByFullPath(form.values, fieldPath));
      let v;
      try {
        v = evaluate(expression, scope);
        v = v && toDbType(v, dataType);
      } catch (error) {
        v = null;
      }
      if (v == null && editingValue == null) {
        setEditingValue(v);
      }
      setEditingValue(v);
    });
  });

  useEffect(() => {
    if (!areValuesEqual(field.value, editingValue)) {
      setTimeout(() => {
        field.value = editingValue;
      });
    }
  }, [editingValue]);
  const Component = TypedComponents[dataType] ?? InputString;
  return (
    <Component {...others} value={dataType === 'double' ? toFixedByStep(editingValue, props.step) : editingValue} />
  );
}

export default Result;
