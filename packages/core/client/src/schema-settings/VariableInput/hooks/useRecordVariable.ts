import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions, useCollection } from '../../../collection-manager';
import { useRecordV2 } from '../../../data-source/record/RecordProvider';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionField?: CollectionFieldOptions;
  schema?: any;
  /** @deprecated */
  collectionName?: string;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}

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
 * 变量：`当前记录`
 * @param props
 * @returns
 */
export const useCurrentRecordVariable = (props: Props = {}) => {
  const { t } = useTranslation();
  const record = useRecordV2();
  const { name: collectionName } = useCollection() || {};
  const currentRecordSettings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nRecord',
    title: t('Current record'),
    collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
  });

  return {
    /** 变量配置 */
    currentRecordSettings,
    /** 变量值 */
    currentRecordCtx: record?.data,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayCurrentRecord: !_.isEmpty(record?.data),
    /** 当前记录对应的 collection name */
    collectionName,
  };
};
