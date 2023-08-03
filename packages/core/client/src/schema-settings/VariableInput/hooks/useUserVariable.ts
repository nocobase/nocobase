import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

export const useUserVariable = ({ schema, maxDepth = 3 }: { schema: any; maxDepth?: number }) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    schema,
    maxDepth,
    name: '$user',
    title: t('Current user'),
    collectionName: 'users',
  });

  return result;
};
