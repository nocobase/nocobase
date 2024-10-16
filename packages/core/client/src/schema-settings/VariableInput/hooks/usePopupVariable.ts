/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useCurrentPopupRecord } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`Current popup record`的上下文
 * @returns
 */
export const usePopupVariableContext = () => {
  const { value, title, collection } = useCurrentPopupRecord() || {};
  const { isVariableParsedInOtherContext } = useFlag();

  return {
    /** 变量值 */
    popupRecordCtx: value,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayPopupRecord: !!value && !isVariableParsedInOtherContext,
    /** 当前记录对应的 collection name */
    collectionName: collection?.name,
    dataSource: collection?.dataSource,
    /** 不可删除*/
    defaultValue: undefined,
    title,
  };
};

/**
 * 变量：`Current popup record`
 * @param props
 * @returns
 */
export const usePopupVariable = (props: any = {}) => {
  const { popupRecordCtx, shouldDisplayPopupRecord, collectionName, dataSource, defaultValue, title } =
    usePopupVariableContext();
  const settings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nPopupRecord',
    title,
    collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
    dataSource,
  });

  return {
    /** 变量配置 */
    settings,
    popupRecordCtx,
    shouldDisplayPopupRecord,
    collectionName,
    dataSource,
    defaultValue,
  };
};
