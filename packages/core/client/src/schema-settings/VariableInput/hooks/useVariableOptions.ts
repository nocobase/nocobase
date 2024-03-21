import { Form } from '@formily/core';
import { ISchema, Schema } from '@formily/react';
import { useMemo } from 'react';
import { CollectionFieldOptions_deprecated, useCollection_deprecated } from '../../../collection-manager';
import { useBlockCollection } from './useBlockCollection';
import { useDatetimeVariable } from './useDateVariable';
import { useCurrentFormVariable } from './useFormVariable';
import { useCurrentObjectVariable } from './useIterationVariable';
import { useCurrentParentRecordVariable } from './useParentRecordVariable';
import { useCurrentRecordVariable } from './useRecordVariable';
import { useCurrentRoleVariable } from './useRoleVariable';
import { useCurrentUserVariable } from './useUserVariable';

interface Props {
  /**
   * 消费该变量的字段
   */
  collectionField: CollectionFieldOptions_deprecated;
  form: Form;
  /**
   * `useRecord ` 返回的值
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
  const blockParentCollectionName = record?.__parent?.__collectionName;
  const { currentUserSettings } = useCurrentUserVariable({
    maxDepth: 3,
    uiSchema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const { currentRoleSettings } = useCurrentRoleVariable({
    uiSchema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const { datetimeSettings } = useDatetimeVariable({ operator, schema: uiSchema, noDisabled });
  const { currentFormSettings, shouldDisplayCurrentForm } = useCurrentFormVariable({
    schema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
    form,
  });
  const { currentObjectSettings, shouldDisplayCurrentObject } = useCurrentObjectVariable({
    collectionField,
    schema: uiSchema,
    noDisabled,
    targetFieldSchema,
  });
  const { currentRecordSettings, shouldDisplayCurrentRecord } = useCurrentRecordVariable({
    schema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const { currentParentRecordSettings, shouldDisplayCurrentParentRecord } = useCurrentParentRecordVariable({
    schema: uiSchema,
    collectionName: blockParentCollectionName,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });

  return useMemo(() => {
    return [
      currentUserSettings,
      currentRoleSettings,
      datetimeSettings,
      shouldDisplayCurrentForm && currentFormSettings,
      shouldDisplayCurrentObject && currentObjectSettings,
      shouldDisplayCurrentRecord && currentRecordSettings,
      shouldDisplayCurrentParentRecord && currentParentRecordSettings,
    ].filter(Boolean);
  }, [
    currentUserSettings,
    currentRoleSettings,
    datetimeSettings,
    shouldDisplayCurrentForm,
    currentFormSettings,
    shouldDisplayCurrentObject,
    currentObjectSettings,
    shouldDisplayCurrentRecord,
    currentRecordSettings,
    shouldDisplayCurrentParentRecord,
    currentParentRecordSettings,
  ]);
};
