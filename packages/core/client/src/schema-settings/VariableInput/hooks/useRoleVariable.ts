import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';
import { CollectionFieldOptionsV2 } from '../../../application';

/**
 * 变量：`当前角色`
 * @param param0
 * @returns
 */
export const useRoleVariable = ({
  collectionField,
  uiSchema,
  noDisabled,
  targetFieldSchema,
  maxDepth = 0,
}: {
  collectionField: CollectionFieldOptionsV2;
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
    name: '$nRole',
    title: t('Current role'),
    collectionName: 'roles',
    noDisabled,
    targetFieldSchema,
    noChildren: true,
  });

  return result;
};
