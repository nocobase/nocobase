import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';
import { DEFAULT_DATA_SOURCE_NAME } from '../../../data-source/data-source/DataSourceManager';

/**
 * 变量：`当前用户`
 * @param param0
 * @returns
 */
export const useUserVariable = ({
  collectionField,
  uiSchema,
  noDisabled,
  targetFieldSchema,
  maxDepth = 3,
}: {
  collectionField: CollectionFieldOptions;
  uiSchema: any;
  maxDepth?: number;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema,
    maxDepth,
    name: '$user',
    title: t('Current user'),
    collectionName: 'users',
    dataSource: DEFAULT_DATA_SOURCE_NAME,
    noDisabled,
    targetFieldSchema,
  });

  return result;
};
