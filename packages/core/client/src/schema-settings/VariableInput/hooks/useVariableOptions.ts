/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { ISchema, Schema } from '@formily/react';
import { useMemo } from 'react';
import { useVariables } from '../../../';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useAPITokenVariable } from './useAPITokenVariable';
import { useDatetimeVariable } from './useDateVariable';
import { useExactDateVariable } from './useExactDateVariable';

import { useCurrentFormVariable } from './useFormVariable';
import { useCurrentObjectVariable } from './useIterationVariable';
import { useParentObjectVariable } from './useParentIterationVariable';
import { useParentPopupVariable } from './useParentPopupVariable';
import { useCurrentParentRecordVariable } from './useParentRecordVariable';
import { usePopupVariable } from './usePopupVariable';
import { useCurrentRecordVariable } from './useRecordVariable';
import { useCurrentRoleVariable } from './useRoleVariable';
import { useURLSearchParamsVariable } from './useURLSearchParamsVariable';
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
  const { filterVariables = () => true } = useVariables() || {};
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
  const { apiTokenSettings } = useAPITokenVariable({ noDisabled });
  const { datetimeSettings } = useDatetimeVariable({ operator, schema: uiSchema, noDisabled: true, targetFieldSchema });
  const { exactDateTimeSettings, shouldDisplayExactDate } = useExactDateVariable({
    operator,
    schema: uiSchema,
    noDisabled: true,
    targetFieldSchema,
  });

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
  const { parentObjectSettings, shouldDisplayParentObject } = useParentObjectVariable({
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
  const { settings: popupRecordSettings, shouldDisplayPopupRecord } = usePopupVariable({
    schema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const { settings: parentPopupRecordSettings, shouldDisplayParentPopupRecord } = useParentPopupVariable({
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
  const { urlSearchParamsSettings, shouldDisplay: shouldDisplayURLSearchParams } = useURLSearchParamsVariable();
  return useMemo(() => {
    return [
      currentUserSettings,
      currentRoleSettings,
      apiTokenSettings,
      !shouldDisplayExactDate && datetimeSettings,
      shouldDisplayExactDate && exactDateTimeSettings,
      shouldDisplayCurrentForm && currentFormSettings,
      shouldDisplayCurrentObject && currentObjectSettings,
      shouldDisplayParentObject && parentObjectSettings,
      shouldDisplayCurrentRecord && currentRecordSettings,
      shouldDisplayCurrentParentRecord && currentParentRecordSettings,
      shouldDisplayPopupRecord && popupRecordSettings,
      shouldDisplayParentPopupRecord && parentPopupRecordSettings,
      shouldDisplayURLSearchParams && urlSearchParamsSettings,
    ]
      .filter(Boolean)
      .filter(filterVariables);
  }, [
    currentUserSettings,
    currentRoleSettings,
    apiTokenSettings,
    datetimeSettings,
    shouldDisplayCurrentForm,
    currentFormSettings,
    shouldDisplayCurrentObject,
    currentObjectSettings,
    shouldDisplayParentObject,
    parentObjectSettings,
    shouldDisplayCurrentRecord,
    currentRecordSettings,
    shouldDisplayCurrentParentRecord,
    currentParentRecordSettings,
    shouldDisplayPopupRecord,
    popupRecordSettings,
    shouldDisplayURLSearchParams,
    urlSearchParamsSettings,
  ]);
};
