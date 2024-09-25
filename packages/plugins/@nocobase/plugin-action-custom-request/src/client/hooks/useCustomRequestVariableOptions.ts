/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DEFAULT_DATA_SOURCE_KEY,
  useCollection_deprecated,
  useCollectionFilterOptions,
  useCompile,
} from '@nocobase/client';
import { useMemo } from 'react';
import { useTranslation } from '../locale';

export const useCustomRequestVariableOptions = () => {
  const collection = useCollection_deprecated();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users', DEFAULT_DATA_SOURCE_KEY);
  const compile = useCompile();

  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [fieldsOptions, userFieldOptions]);

  return useMemo(() => {
    return [
      {
        name: 'currentRecord',
        title: t('Current record', { ns: 'client' }),
        children: [...fields],
      },
      {
        name: 'currentUser',
        title: t('Current user', { ns: 'client' }),
        children: userFields,
      },
      {
        name: 'currentTime',
        title: t('Current time', { ns: 'client' }),
        children: null,
      },
      {
        name: '$nToken',
        title: 'API token',
        children: null,
      },
    ];
  }, [fields, userFields]);
};
