/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { toJS } from '@formily/reactive';
import { EditableItemModel, DisplayItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { Form } from 'antd';
import { Checkbox, DatePicker, FieldModel, InputNumber, Input as InputString } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry, toFixedByStep } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { toDbType } from '../utils';

const TypedComponents = {
  boolean: Checkbox.ReadPretty,
  integer: InputNumber.ReadPretty,
  bigInt: InputNumber.ReadPretty,
  double: InputNumber.ReadPretty,
  decimal: InputNumber.ReadPretty,
  number: InputNumber.ReadPretty,
  date: DatePicker.ReadPretty,
  string: InputString.ReadPretty,
};

const EditableComponents = {
  boolean: Checkbox,
  integer: InputNumber,
  bigInt: InputNumber,
  double: InputNumber,
  decimal: InputNumber,
  number: InputNumber,
  date: DatePicker,
  string: InputString,
};

function getValuesByPath(values, key, index?) {
  const targetValue = values?.[key];
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
  let value = values || {};
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

const resolveFormulaUsageFlags = (form: any, ctx?: any) => {
  const flags = form?.props?.['x-flag'] || ctx?.flags || {};
  const hasFlags = !!flags && Object.keys(flags).length > 0;
  const isFilterContext = !!(flags?.isInFilterFormBlock || flags?.isInFilterAction);
  const isDefaultValueDialog = !!flags?.isInSetDefaultValueDialog;
  return { flags, hasFlags, isFilterContext, isDefaultValueDialog };
};

export function FormulaResult(props) {
  const { value, collectionField, form, id, context, ...others } = props;
  const { dataType, expression, engine = 'math.js' } = collectionField?.options || {};
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const antdForm = typeof form?.getFieldsValue === 'function' ? form : undefined;
  const watchedValues = Form.useWatch([], antdForm);
  const fieldPath = Array.isArray(id) ? id?.join('.') : id;
  const { t } = useTranslation();

  const { flags, isFilterContext, isDefaultValueDialog } = resolveFormulaUsageFlags(form, context);

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  useEffect(() => {
    // DefaultValue 弹窗：constant/null 时不计算
    const constantOrNull = isDefaultValueDialog && (flags?.constant || flags?.null || flags?.root === 'constant');

    if (form?.readPretty || isFilterContext || isDefaultValueDialog || constantOrNull) {
      return;
    }
    const formValues = typeof form?.getFieldsValue === 'function' ? form.getFieldsValue() : form?.values || {};
    const scope = toJS(getValuesByFullPath(formValues, fieldPath));
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
  }, [watchedValues]);

  useEffect(() => {
    if (!areValuesEqual(value, editingValue) && !isFilterContext && !isDefaultValueDialog) {
      setTimeout(() => {
        if (typeof form?.setFieldValue === 'function') {
          form.setFieldValue(fieldPath, editingValue);
        }
      });
    }
  }, [editingValue, isFilterContext, isDefaultValueDialog]);

  // 筛选/默认值等场景下需要可编辑组件
  if (isFilterContext || isDefaultValueDialog) {
    const EditableComp = EditableComponents[dataType] ?? InputString;
    return <EditableComp {...others} value={value} onChange={(...args) => others?.onChange?.(...args)} />;
  }

  const Component = TypedComponents[dataType] ?? InputString;
  if (!collectionField) {
    return;
  }
  return (
    <Component {...others} value={dataType === 'double' ? toFixedByStep(editingValue, props.step) : editingValue} />
  );
}

export class FormulaFieldModel extends FieldModel {
  render() {
    return (
      <FormulaResult
        {...this.props}
        collectionField={this.context.collectionField}
        form={this.context.form}
        context={this.context}
      />
    );
  }
}

EditableItemModel.bindModelToInterface('FormulaFieldModel', ['formula'], { isDefault: true });

DisplayItemModel.bindModelToInterface('DisplayCheckboxFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'boolean';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayDateTimeFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'date';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'string';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayNumberFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return ['double', 'bigInt', 'integer'].includes(fieldInstance.dataType);
    }
    return true;
  },
});

FilterableItemModel.bindModelToInterface('FormulaFieldModel', ['formula'], {
  isDefault: true,
  when(ctx) {
    const { hasFlags, isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return hasFlags && !isFilterContext;
  },
});

// 在筛选场景下使用可编辑模型，按 dataType 选择合适的组件
FilterableItemModel.bindModelToInterface('InputFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    if (!isFilterContext) return false;
    const dataType = fieldInstance?.dataType;
    return !['date', 'boolean', 'integer', 'bigInt', 'double', 'decimal', 'number'].includes(dataType);
  },
});

FilterableItemModel.bindModelToInterface('DateTimeFilterFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return isFilterContext && fieldInstance?.dataType === 'date';
  },
});

FilterableItemModel.bindModelToInterface('CheckboxFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return isFilterContext && fieldInstance?.dataType === 'boolean';
  },
});

FilterableItemModel.bindModelToInterface('NumberFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    if (!isFilterContext) return false;
    return ['integer', 'bigInt', 'double', 'decimal', 'number'].includes(fieldInstance?.dataType);
  },
});
