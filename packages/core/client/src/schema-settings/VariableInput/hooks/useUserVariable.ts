import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前用户`
 * @param param0
 * @returns
 */
export const useUserVariable = ({
  collectionField,
  uiSchema,
  noDisabled,
  maxDepth = 3,
}: {
  collectionField: CollectionFieldOptions;
  uiSchema: any;
  maxDepth?: number;
  noDisabled?: boolean;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema,
    maxDepth,
    name: '$user',
    title: t('Current user'),
    collectionName: 'users',
    noDisabled,
  });

  return result;
};
