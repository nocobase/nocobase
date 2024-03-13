import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { useCollectionRecord } from '../../../data-source/collection-record/CollectionRecordProvider';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useBaseVariable } from './useBaseVariable';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';

interface Props {
  collectionField?: CollectionFieldOptions_deprecated;
  schema?: any;
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
  const formBlockCtx = useFormBlockContext();
  const formBlockRecord = formBlockCtx?.record;
  const currentRecordSettings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nRecord',
    title: t('Current record'),
    collectionName: props.collectionName || formBlockCtx?.collectionName,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
  });

  return {
    /** 变量配置 */
    currentRecordSettings,
    /** 变量值 */
    currentRecordCtx: formBlockRecord?.data,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayCurrentRecord: !_.isEmpty(formBlockRecord?.data),
    /** 当前记录对应的 collection name */
    collectionName: formBlockCtx?.collectionName,
  };
};
