import { useCollectionFilterOptions, useCollectionV2, useCompile } from '@nocobase/client';
import { useTranslation } from '../locale';
import { useMemo } from 'react';

export const useCustomRequestVariableOptions = () => {
  const collection = useCollectionV2();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users');
  const compile = useCompile();

  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [compile, fieldsOptions, userFieldOptions]);
  return useMemo(() => {
    return [
      {
        name: 'currentRecord',
        title: t('Current record'),
        children: [...fields],
      },
      {
        name: 'currentUser',
        title: t('Current user'),
        children: userFields,
      },
      {
        name: 'currentTime',
        title: t('Current time'),
        children: null,
      },
    ];
  }, [fields, userFields]);
};
