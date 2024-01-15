import { Form } from '@formily/core';
import { ISchema, Schema } from '@formily/react';
import _ from 'lodash';
import { useMemo } from 'react';
import { CollectionFieldOptions, useCollection } from '../../../collection-manager';
import { useFlag } from '../../../flag-provider';
import { useBlockCollection } from './useBlockCollection';
import { useDateVariable } from './useDateVariable';
import { useFormVariable } from './useFormVariable';
import { useIterationVariable } from './useIterationVariable';
import { useParentRecordVariable } from './useParentRecordVariable';
import { useRecordVariable } from './useRecordVariable';
import { useRoleVariable } from './useRoleVariable';
import { useUserVariable } from './useUserVariable';

interface Props {
  /**
   * 消费该变量的字段
   */
  collectionField: CollectionFieldOptions;
  form: Form;
  /**
   * `useRecord` 返回的值
   */
  record?: Record<string, any>;
  /**
   * `Filter` 组件中选中的字段的 `uiSchema`，比如设置 `数据范围` 的时候在左侧选择的字段
   */
  uiSchema?: ISchema;
  /**
   * `Filter` 组件中的操作符，比如设置 `数据范围` 的时候在中间选择的操作符
   */
  operator?: { value: string };
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}

export const useVariableOptions = ({
  collectionField,
  form,
  uiSchema,
  operator,
  noDisabled,
  targetFieldSchema,
  record,
}: Props) => {
  const { name: blockCollectionName = record?.__collectionName } = useBlockCollection();
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const { name } = useCollection();
  const blockParentCollectionName = record?.__parent?.__collectionName;
  const userVariable = useUserVariable({
    maxDepth: 3,
    uiSchema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const roleVariable = useRoleVariable({
    uiSchema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const dateVariable = useDateVariable({ operator, schema: uiSchema, noDisabled });
  const formVariable = useFormVariable({
    schema: uiSchema,
    collectionName: blockCollectionName,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const iterationVariable = useIterationVariable({
    currentCollection: name,
    collectionField,
    schema: uiSchema,
    noDisabled,
    targetFieldSchema,
  });
  const currentRecordVariable = useRecordVariable({
    schema: uiSchema,
    collectionName: blockCollectionName,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const currentParentRecordVariable = useParentRecordVariable({
    schema: uiSchema,
    collectionName: blockParentCollectionName,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });

  return useMemo(() => {
    return [
      userVariable,
      roleVariable,
      dateVariable,
      form && !form.readPretty && formVariable,
      (isInSubForm || isInSubTable) && iterationVariable,
      blockCollectionName && !_.isEmpty(_.omit(record, ['__parent', '__collectionName'])) && currentRecordVariable,
      blockParentCollectionName &&
        !_.isEmpty(_.omit(record?.__parent, ['__parent', '__collectionName'])) &&
        currentParentRecordVariable,
    ].filter(Boolean);
  }, [
    userVariable,
    roleVariable,
    dateVariable,
    form,
    formVariable,
    isInSubForm,
    isInSubTable,
    iterationVariable,
    blockCollectionName,
    record,
    currentRecordVariable,
    blockParentCollectionName,
    currentParentRecordVariable,
  ]);
};
