/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollection, useCollectionField } from '../../../data-source';
import { useCollectionRecord } from '../../../data-source/collection-record/CollectionRecordProvider';
import { useParentCollection } from '../../../data-source/collection/AssociationProvider';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionField?: CollectionFieldOptions_deprecated;
  schema?: any;
  /** @deprecated */
  collectionName?: string;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useCurrentParentRecordVariable` 代替
 *
 * @param props
 * @returns
 */
export const useParentRecordVariable = (props: Props) => {
  const { t } = useTranslation();

  const currentRecordVariable = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nParentRecord',
    title: t('Parent record'),
    collectionName: props.collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
  });

  return currentRecordVariable;
};

/**
 * 变量：`上级记录`的上下文
 * @returns
 */
export const useCurrentParentRecordContext = () => {
  const record = useCollectionRecord();
  const { name: parentCollectionName, dataSource: parentDataSource } = useParentCollection() || {};
  const collection = useCollection();
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const dataSource = parentCollectionName ? parentDataSource : collection?.dataSource;
  const associationCollectionField = useCollectionField();

  return {
    // 当该变量使用在区块数据范围的时候，由于某些区块（如 Table）是在 DataBlockProvider 之前解析 filter 的，
    // 导致此时 record.parentRecord 的值还是空的，此时正确的值应该是 record，所以在后面加了 record?.data 来防止这种情况
    currentParentRecordCtx: record?.parentRecord?.data || record?.data,
    shouldDisplayCurrentParentRecord:
      !!record?.parentRecord?.data && !isInSubForm && !isInSubTable && associationCollectionField,
    // 在后面加上 collection?.name 的原因如上面的变量一样
    collectionName: parentCollectionName || collection?.name,
    dataSource,
  };
};

/**
 * 变量：`上级记录`
 * @param props
 * @returns
 */
export const useCurrentParentRecordVariable = (props: Props = {}) => {
  const { t } = useTranslation();
  const { currentParentRecordCtx, shouldDisplayCurrentParentRecord, collectionName, dataSource } =
    useCurrentParentRecordContext();

  const currentParentRecordSettings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nParentRecord',
    title: t('Parent record'),
    collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
    dataSource,
  });

  return {
    currentParentRecordSettings,
    currentParentRecordCtx,
    shouldDisplayCurrentParentRecord,
    collectionName,
    dataSource,
  };
};
