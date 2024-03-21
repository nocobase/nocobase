import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useParentCollection } from '../../../data-source/collection/AssociationProvider';
import { useCollectionRecord } from '../../../data-source/collection-record/CollectionRecordProvider';
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
 * 变量：`上级记录`
 * @param props
 * @returns
 */
export const useCurrentParentRecordVariable = (props: Props = {}) => {
  const { t } = useTranslation();
  const record = useCollectionRecord();
  const { name: parentCollectionName } = useParentCollection() || {};
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const currentParentRecordSettings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nParentRecord',
    title: t('Parent record'),
    collectionName: parentCollectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
  });

  return {
    currentParentRecordSettings,
    currentParentRecordCtx: record?.parentRecord?.data,
    shouldDisplayCurrentParentRecord: !!record?.parentRecord?.data && !isInSubForm && !isInSubTable,
    collectionName: parentCollectionName,
  };
};
