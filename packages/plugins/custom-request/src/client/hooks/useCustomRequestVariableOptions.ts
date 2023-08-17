import { useCollection, useCollectionFilterOptions, useCompile, useRecord, useVariableScope } from '@nocobase/client';
import { NAMESPACE, useTranslation } from '../../locale';
import { useEffect, useMemo } from 'react';
import { useFieldSchema } from '@formily/react';

export const useCustomRequestVariableOptions = () => {
  const collection = useCollection();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users');
  const compile = useCompile();

  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [fieldsOptions, userFieldOptions]);
  return useMemo(() => {
    return [
      {
        name: 'currentRecord',
        title: t('Current record'),
        children: [
          ...fields,
          // {
          //   name: 'createdBy',
          //   title: 'Created By',
          //   children: userFields,
          //   hidden: !collection.getField('createdBy'),
          // },
          // {
          //   name: 'updatedBy',
          //   title: 'Updated By',
          //   children: userFields,
          //   hidden: !collection.getField('updatedBy'),
          // },
        ],
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
