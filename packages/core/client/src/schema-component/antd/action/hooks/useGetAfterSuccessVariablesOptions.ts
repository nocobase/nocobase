/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useCollection_deprecated, useCollectionFilterOptions } from '../../../../collection-manager';
import { useCollectionRecordData } from '../../../../data-source';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../../';
import { useBlockContext } from '../../../../block-provider/BlockProvider';

export const useAfterSuccessOptions = () => {
  const collection = useCollection_deprecated();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users', 'main');
  const compile = useCompile();
  const recordData = useCollectionRecordData();
  const { name: blockType } = useBlockContext() || {};
  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [fieldsOptions, userFieldOptions]);

  return useMemo(() => {
    return [
      {
        name: '$record',
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
    ];
  }, [recordData, t, fields, blockType, userFields]);
};
