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
  useBlockContext,
  useCollection_deprecated,
  useCollectionFilterOptions,
  useCollectionRecordData,
  useCompile,
  VariablesContext,
} from '@nocobase/client';
import { useMemo, useContext } from 'react';
import { useTranslation } from '../locale';

export const useCustomRequestVariableOptions = () => {
  const collection = useCollection_deprecated();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users', DEFAULT_DATA_SOURCE_KEY);
  const compile = useCompile();
  const recordData = useCollectionRecordData();
  const { name: blockType } = useBlockContext() || {};
  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [fieldsOptions, userFieldOptions]);
  const data = useContext(VariablesContext);
  return useMemo(() => {
    return [
      data.ctxRef.current['$env'],
      recordData && {
        name: 'currentRecord',
        title: t('Current record', { ns: 'client' }),
        children: [...fields],
      },
      blockType === 'form' && {
        name: '$nForm',
        title: t('Current form', { ns: 'client' }),
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
    ].filter(Boolean);
  }, [recordData, t, fields, blockType, userFields]);
};
