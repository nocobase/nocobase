/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as operators from '../../../../collection-manager/interfaces/properties/operators';

type OperatorMeta = {
  label: string;
  value: string;
  selected?: boolean;
  noValue?: boolean;
  schema?: Record<string, any>;
  visible?: (meta: any) => boolean;
  [key: string]: any;
};

type ResolveOperatorParams = {
  flowEngine: any;
  fieldModel?: string;
  source?: string[];
  fieldModelProps?: Record<string, any>;
};

const MODEL_OPERATOR_MAP: Record<string, OperatorMeta[] | ((props: Record<string, any>) => OperatorMeta[])> = {
  InputFieldModel: operators.string,
  NumberFieldModel: operators.number,
  DateTimeFilterFieldModel: operators.datetime,
  SelectFieldModel: (props: Record<string, any>) => (props?.mode === 'multiple' ? operators.array : operators.enumType),
  RadioGroupFieldModel: operators.enumType,
  CheckboxGroupFieldModel: operators.array,
};

const MULTI_VALUE_OPERATOR_VALUES = new Set(['$in', '$notIn', '$empty', '$notEmpty', '$includes', '$notIncludes']);
const MULTI_VALUE_IN_OPERATOR: OperatorMeta = {
  label: '{{t("is any of")}}',
  value: '$in',
  schema: { 'x-component': 'Select', 'x-component-props': { mode: 'tags' } },
};
const MULTI_VALUE_NOT_IN_OPERATOR: OperatorMeta = {
  label: '{{t("is none of")}}',
  value: '$notIn',
  schema: { 'x-component': 'Select', 'x-component-props': { mode: 'tags' } },
};
const INTERFACE_FALLBACK_OPERATORS: Record<string, OperatorMeta[]> = {
  input: operators.string,
  email: operators.string,
  phone: operators.string,
  uuid: operators.string,
  url: operators.string,
  nanoid: operators.string,
  textarea: operators.string,
  markdown: operators.bigField,
  vditor: operators.bigField,
  richText: operators.bigField,
  password: operators.string,
  color: operators.string,
  number: operators.number,
  integer: operators.number,
  id: operators.id,
  snowflakeId: operators.number,
  dateOnly: operators.datetime,
  datetime: operators.datetime,
  datetimeNoTz: operators.datetime,
  unixTimestamp: operators.datetime,
  time: operators.time,
  select: operators.enumType,
  multipleSelect: operators.array,
  radioGroup: operators.enumType,
  checkboxGroup: operators.array,
  checkbox: operators.boolean,
};

function getOperatorListByModel(fieldModel: string, fieldModelProps: Record<string, any> = {}): OperatorMeta[] {
  const value = MODEL_OPERATOR_MAP[fieldModel];
  if (!value) return [];
  return typeof value === 'function' ? value(fieldModelProps) || [] : value || [];
}

function getSourceField(flowEngine: any, source: string[] = [], fallbackDataSourceKey?: string) {
  if (!Array.isArray(source) || source.length === 0) return;
  const hasDataSourceKey = !!flowEngine?.dataSourceManager?.getDataSource?.(source[0]);
  const dataSourceKey = hasDataSourceKey ? source[0] : fallbackDataSourceKey || 'main';
  const fieldPath = (hasDataSourceKey ? source.slice(1) : source).join('.');
  if (!fieldPath) return;
  return flowEngine?.dataSourceManager?.getCollectionField?.(`${dataSourceKey}.${fieldPath}`);
}

function getFieldOperators(field: any): OperatorMeta[] {
  if (!field) return [];
  const fieldDefinedOperators = field.filterable?.operators;
  if (Array.isArray(fieldDefinedOperators) && fieldDefinedOperators.length > 0) {
    return fieldDefinedOperators;
  }

  let interfaceOperators;
  try {
    interfaceOperators = field.getInterfaceOptions?.()?.filterable?.operators;
  } catch (error) {
    interfaceOperators = undefined;
  }
  if (Array.isArray(interfaceOperators) && interfaceOperators.length > 0) {
    return interfaceOperators;
  }

  if (field.interface && INTERFACE_FALLBACK_OPERATORS[field.interface]) {
    return INTERFACE_FALLBACK_OPERATORS[field.interface];
  }

  return operators?.[field.type] || [];
}

function isRecordSelectMultiple(fieldModelProps: Record<string, any> = {}) {
  if (typeof fieldModelProps?.multiple === 'boolean') return fieldModelProps.multiple;
  if (typeof fieldModelProps?.allowMultiple === 'boolean') return fieldModelProps.allowMultiple;
  return true;
}

function toUniqueOperators(operatorList: OperatorMeta[] = []): OperatorMeta[] {
  const seen = new Set<string>();
  return operatorList.filter((operatorItem) => {
    if (!operatorItem?.value || seen.has(operatorItem.value)) return false;
    seen.add(operatorItem.value);
    return true;
  });
}

function toMultiValueOperators(baseList: OperatorMeta[] = []): OperatorMeta[] {
  const hasInInBaseList = baseList.some((item) => item?.value === '$in');
  const hasNotInInBaseList = baseList.some((item) => item?.value === '$notIn');
  const mapped = baseList.filter(
    (item) =>
      (MULTI_VALUE_OPERATOR_VALUES.has(item?.value) && item?.value !== '$in' && item?.value !== '$notIn') ||
      item?.noValue ||
      item?.value === '$exists' ||
      item?.value === '$notExists',
  );
  const hasValueComparableOperator = baseList.some(
    (item) => item?.value && !item.noValue && item.value !== '$exists' && item.value !== '$notExists',
  );
  const shouldProvideIn = hasValueComparableOperator || hasInInBaseList;
  const shouldProvideNotIn = hasValueComparableOperator || hasNotInInBaseList;
  const normalizedInGroup: OperatorMeta[] = [];

  if (shouldProvideIn) {
    normalizedInGroup.push(MULTI_VALUE_IN_OPERATOR);
  }
  if (shouldProvideNotIn) {
    normalizedInGroup.push(MULTI_VALUE_NOT_IN_OPERATOR);
  }
  return toUniqueOperators([...normalizedInGroup, ...mapped]);
}

function getRecordSelectValueField(flowEngine: any, fieldModelProps: Record<string, any> = {}, source: string[] = []) {
  const sourceField = getSourceField(flowEngine, source, fieldModelProps?.recordSelectDataSourceKey);
  const defaultDataSourceKey = sourceField?.dataSourceKey || source?.[0] || 'main';
  const dataSourceKey = fieldModelProps?.recordSelectDataSourceKey || defaultDataSourceKey;
  const targetCollectionName =
    fieldModelProps?.recordSelectTargetCollection || sourceField?.targetCollection?.name || sourceField?.target;
  if (!targetCollectionName) return;

  const targetCollection = flowEngine?.dataSourceManager?.getCollection?.(dataSourceKey, targetCollectionName);
  if (!targetCollection) return;

  const valueFieldName =
    fieldModelProps?.recordSelectValueField || targetCollection?.filterTargetKey || targetCollection?.getPrimaryKey?.();
  if (!valueFieldName) return;
  return targetCollection.getField?.(valueFieldName);
}

function resolveByRecordSelect(params: ResolveOperatorParams): { operatorList: OperatorMeta[]; meta: any } {
  const { flowEngine, fieldModelProps = {}, source = [] } = params;
  const valueField = getRecordSelectValueField(flowEngine, fieldModelProps, source);
  const baseList = getFieldOperators(valueField);
  const operatorList = isRecordSelectMultiple(fieldModelProps) ? toMultiValueOperators(baseList) : baseList;
  return { operatorList, meta: valueField };
}

function resolveByModelOrSource(params: ResolveOperatorParams): { operatorList: OperatorMeta[]; meta: any } {
  const { flowEngine, fieldModel, fieldModelProps = {}, source = [] } = params;
  if (fieldModel === 'FilterFormCustomRecordSelectFieldModel') {
    return resolveByRecordSelect(params);
  }

  const modelOperators = getOperatorListByModel(fieldModel, fieldModelProps);
  if (modelOperators.length > 0) {
    return { operatorList: modelOperators, meta: { fieldModel } };
  }

  const sourceField = getSourceField(flowEngine, source);
  return {
    operatorList: getFieldOperators(sourceField),
    meta: sourceField,
  };
}

export function resolveCustomFieldOperatorList(params: ResolveOperatorParams): OperatorMeta[] {
  const { operatorList, meta } = resolveByModelOrSource(params);
  return toUniqueOperators((operatorList || []).filter((item) => !item?.visible || item.visible(meta)));
}

export function resolveDefaultCustomFieldOperator(params: ResolveOperatorParams): string | undefined {
  const { fieldModel, fieldModelProps = {} } = params;
  const operatorList = resolveCustomFieldOperatorList(params);
  if (fieldModel === 'DateTimeFilterFieldModel' && fieldModelProps?.isRange) {
    const between = operatorList.find((item) => item.value === '$dateBetween');
    if (between) return between.value;
  }
  return operatorList.find((item) => item.selected)?.value || operatorList[0]?.value;
}

export function toOperatorSelectOptions(
  operatorList: OperatorMeta[] = [],
  translate: (text: string) => string = (text) => text,
) {
  return operatorList.map((item) => ({
    ...item,
    label: translate(item.label),
    value: item.value,
  }));
}
