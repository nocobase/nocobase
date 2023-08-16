import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前用户`
 * @param param0
 * @returns
 */
export const useUserVariable = ({ uiSchema, maxDepth = 3 }: { uiSchema: any; maxDepth?: number }) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    uiSchema,
    maxDepth,
    name: '$user',
    title: t('Current user'),
    collectionName: 'users',
  });

  return result;
};
