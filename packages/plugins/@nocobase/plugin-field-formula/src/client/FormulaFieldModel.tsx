/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableFieldModel } from '@nocobase/client';
import { onFormValuesChange } from '@formily/core';
import { useFormEffects } from '@formily/react';
import { toJS } from '@formily/reactive';
import { Checkbox, DatePicker, InputNumber, Input as InputString } from '@nocobase/client';
import _ from 'lodash';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import React, { useEffect, useState } from 'react';
import { useFlowModel } from '@nocobase/flow-engine';

import { toDbType } from '../utils';

const TypedComponents = {
  boolean: Checkbox.ReadPretty,
  integer: InputNumber.ReadPretty,
  bigInt: InputNumber.ReadPretty,
  double: InputNumber.ReadPretty,
  decimal: InputNumber.ReadPretty,
  date: DatePicker.ReadPretty,
  string: InputString.ReadPretty,
};

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

function Result(props) {
  const { value, ...others } = props;
  const model: any = useFlowModel();
  const collectionField = model.collectionField;
  const { dataType, expression, engine = 'math.js' } = collectionField.options;
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const field: any = model.field;
  const fieldPath = model.fieldPath;
  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  useFormEffects(() => {
    onFormValuesChange((form) => {
      if ((fieldPath as string).indexOf('.') >= 0 || model.form?.readPretty) {
        return;
      }
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

export class FormulaFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['formula'];

  get component() {
    return [Result, {}];
  }
}
