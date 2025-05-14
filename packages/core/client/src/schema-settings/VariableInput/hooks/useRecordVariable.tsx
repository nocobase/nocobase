/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import React, { createContext, FC, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlockContext } from '../../../block-provider/BlockProvider';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollection, useCollectionRecordData } from '../../../data-source';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionField?: CollectionFieldOptions_deprecated;
  schema?: any;
  collectionName?: string;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}

interface CurrentRecordContextProps {
  recordData: any;
  collectionName: string;
}

const CurrentRecordContext = createContext<CurrentRecordContextProps>(null);

export const CurrentRecordContextProvider: FC<CurrentRecordContextProps> = (props) => {
  const value = useMemo(() => {
    return {
      recordData: props.recordData,
      collectionName: props.collectionName,
    };
  }, [props.recordData, props.collectionName]);

  return <CurrentRecordContext.Provider value={value}> {props.children} </CurrentRecordContext.Provider>;
};

export const useCurrentRecord = () => {
  return useContext(CurrentRecordContext);
};

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useCurrentRecordVariable` 代替
 *
 * 变量：`当前记录`
 * @param props
 * @returns
 */
export const useRecordVariable = (props: Props) => {
  const { t } = useTranslation();

  const currentRecordVariable = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nRecord',
    title: t('Current record'),
    collectionName: props.collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
  });

  return currentRecordVariable;
};

/**
 * 变量：`当前记录`的上下文
 * @returns
 */
export const useCurrentRecordContext = () => {
  const ctx = useCurrentRecord();
  const { name: blockType } = useBlockContext() || {};
  const collection = useCollection();
  const recordData = useCollectionRecordData();
  const { formRecord, collectionName } = useFormBlockContext();
  let realCollectionName = formRecord?.data ? collectionName : collection?.name;

  realCollectionName = ctx?.collectionName || realCollectionName;

  return {
    /** 变量值 */
    currentRecordCtx: ctx?.recordData || formRecord?.data || recordData,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayCurrentRecord:
      !_.isEmpty(_.omit(recordData, ['__collectionName', '__parent'])) ||
      !!formRecord?.data ||
      blockType === 'taleColumn',
    /** 当前记录对应的 collection name */
    collectionName: realCollectionName,
    /** 块类型 */
    blockType,
    dataSource: collection?.dataSource,
  };
};

/**
 * 变量：`当前记录`
 * @param props
 * @returns
 */
export const useCurrentRecordVariable = (props: Props = {}) => {
  const { t } = useTranslation();
  const { currentRecordCtx, shouldDisplayCurrentRecord, collectionName, blockType, dataSource } =
    useCurrentRecordContext();
  const currentRecordSettings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nRecord',
    title: t('Current record'),
    collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
    deprecated: blockType === 'form' && !shouldDisplayCurrentRecord,
    tooltip: blockType === 'form' ? t('This variable has been deprecated and can be replaced with "Current form"') : '',
    dataSource,
  });

  return {
    /** 变量配置 */
    currentRecordSettings,
    /** 变量值 */
    currentRecordCtx,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayCurrentRecord,
    /** 当前记录对应的 collection name */
    collectionName,
  };
};
