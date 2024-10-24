/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useParentPopupRecord } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`Parent popup record`的上下文
 * @returns
 */
export const useParentPopupVariableContext = () => {
  const { value, title, collection } = useParentPopupRecord() || {};
  const { isVariableParsedInOtherContext } = useFlag();

  return {
    /** 变量值 */
    parentPopupRecordCtx: value,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayParentPopupRecord: !!value && !isVariableParsedInOtherContext,
    /** 当前记录对应的 collection name */
    collectionName: collection?.name,
    dataSource: collection?.dataSource,
    /** 不可删除 */
    defaultValue: undefined,
    title,
  };
};

/**
 * 变量：`Parent popup record`
 * @param props
 * @returns
 */
export const useParentPopupVariable = (props: any = {}) => {
  const { parentPopupRecordCtx, shouldDisplayParentPopupRecord, collectionName, dataSource, defaultValue, title } =
    useParentPopupVariableContext();
  const settings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nParentPopupRecord',
    title,
    collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
    dataSource,
  });

  return {
    /** 变量配置 */
    settings,
    parentPopupRecordCtx,
    shouldDisplayParentPopupRecord,
    collectionName,
    dataSource,
    defaultValue,
  };
};
