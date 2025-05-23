/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { useMemo } from 'react';
import { useCollection_deprecated } from '../../collection-manager';
import { useBlockCollection } from '../../schema-settings/VariableInput/hooks/useBlockCollection';
import { useDatetimeVariableContext } from '../../schema-settings/VariableInput/hooks/useDateVariable';
import { useCurrentFormContext } from '../../schema-settings/VariableInput/hooks/useFormVariable';
import { useCurrentObjectContext } from '../../schema-settings/VariableInput/hooks/useIterationVariable';
import { useParentObjectContext } from '../../schema-settings/VariableInput/hooks/useParentIterationVariable';
import { useParentPopupVariableContext } from '../../schema-settings/VariableInput/hooks/useParentPopupVariable';
import { useCurrentParentRecordContext } from '../../schema-settings/VariableInput/hooks/useParentRecordVariable';
import { usePopupVariableContext } from '../../schema-settings/VariableInput/hooks/usePopupVariable';
import { useCurrentRecordContext } from '../../schema-settings/VariableInput/hooks/useRecordVariable';
import { VariableOption } from '../types';
import useContextVariable from './useContextVariable';
import { useApp } from '../../application/hooks/useApp';

interface Props {
  collectionName?: string;
  currentForm?: Form;
}

const useLocalVariables = (props?: Props) => {
  const {
    parentObjectCtx,
    shouldDisplayParentObject,
    collectionName: collectionNameOfParentObject,
  } = useParentObjectContext();
  const { currentObjectCtx, shouldDisplayCurrentObject } = useCurrentObjectContext();
  const { currentRecordCtx, collectionName: collectionNameOfRecord } = useCurrentRecordContext();
  const {
    currentParentRecordCtx,
    collectionName: collectionNameOfParentRecord,
    dataSource: currentParentRecordDataSource,
  } = useCurrentParentRecordContext();
  const {
    popupRecordCtx,
    collectionName: collectionNameOfPopupRecord,
    dataSource: popupDataSource,
    defaultValue: defaultValueOfPopupRecord,
  } = usePopupVariableContext();
  const {
    parentPopupRecordCtx,
    collectionName: collectionNameOfParentPopupRecord,
    dataSource: parentPopupDataSource,
    defaultValue: defaultValueOfParentPopupRecord,
  } = useParentPopupVariableContext();
  const { datetimeCtx } = useDatetimeVariableContext();
  const { currentFormCtx } = useCurrentFormContext({ form: props?.currentForm });
  const { name: currentCollectionName } = useCollection_deprecated();
  const contextVariable = useContextVariable();
  let { name } = useBlockCollection();

  if (props?.collectionName) {
    name = props.collectionName;
  }

  const app = useApp();
  const customVariables = app.getVariables?.().map((variable) => {
    return {
      name: variable.name,
      ctx: variable.useCtx(),
    }
  }) || [];

  return useMemo(() => {
    return (
      [
        /**
         * @deprecated
         * 兼容老版本
         */
        {
          name: 'currentRecord',
          ctx: currentRecordCtx,
          collectionName: collectionNameOfRecord,
        },
        /**
         * @deprecated
         * 兼容旧版本的以数据表名称命名的变量，新版本已更名为 `$nForm`
         */
        {
          name,
          ctx: currentFormCtx || currentRecordCtx,
          collectionName: name,
        },
        /**
         * @deprecated
         * 新版本已更名为 `$nForm`
         */
        {
          name: '$form',
          ctx: currentFormCtx,
          collectionName: name,
        },
        {
          name: '$nRecord',
          ctx: currentRecordCtx,
          collectionName: collectionNameOfRecord,
          dataSource: currentParentRecordDataSource,
        },
        {
          name: '$nParentRecord',
          ctx: currentParentRecordCtx,
          collectionName: collectionNameOfParentRecord,
          dataSource: currentParentRecordDataSource,
        },
        {
          name: '$nPopupRecord',
          ctx: popupRecordCtx,
          collectionName: collectionNameOfPopupRecord,
          dataSource: popupDataSource,
          defaultValue: defaultValueOfPopupRecord,
        },
        {
          name: '$nParentPopupRecord',
          ctx: parentPopupRecordCtx,
          collectionName: collectionNameOfParentPopupRecord,
          dataSource: parentPopupDataSource,
          defaultValue: defaultValueOfParentPopupRecord,
        },
        {
          name: '$nForm',
          ctx: currentFormCtx,
          collectionName: name,
        },
        {
          name: '$nDate',
          ctx: datetimeCtx,
        },
        /**
         * @deprecated
         * 兼容旧版本的 `$date` 变量，新版本已弃用
         */
        {
          name: '$date',
          ctx: datetimeCtx,
        },
        contextVariable,
        shouldDisplayCurrentObject && {
          name: '$iteration',
          ctx: currentObjectCtx,
          collectionName: currentCollectionName,
        },
        shouldDisplayParentObject && {
          name: '$nParentIteration',
          ctx: parentObjectCtx,
          collectionName: collectionNameOfParentObject,
        },
        ...customVariables,
      ] as VariableOption[]
    ).filter(Boolean);
  }, [
    currentRecordCtx,
    collectionNameOfRecord,
    name,
    currentFormCtx,
    currentParentRecordCtx,
    collectionNameOfParentRecord,
    currentParentRecordDataSource,
    popupRecordCtx,
    parentPopupRecordCtx,
    collectionNameOfPopupRecord,
    popupDataSource,
    datetimeCtx,
    shouldDisplayCurrentObject,
    currentObjectCtx,
    currentCollectionName,
    defaultValueOfPopupRecord,
    defaultValueOfParentPopupRecord,
    shouldDisplayParentObject,
    parentObjectCtx,
    collectionNameOfParentObject,
    contextVariable,
    ...customVariables.map(item => item.ctx),
  ]); // 尽量保持返回的值不变，这样可以减少接口的请求次数，因为关系字段会缓存到变量的 ctx 中
};

export default useLocalVariables;
