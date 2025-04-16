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
  useGlobalVariable,
  useContextAssociationFields,
  useTableBlockContext,
  useCurrentPopupContext,
  getStoredPopupContext,
  useFormBlockContext,
} from '@nocobase/client';
import { useMemo } from 'react';
import { isEmpty } from 'lodash';
import { useTranslation } from '../locale';

const useIsShowTableSelectRecord = () => {
  const { params } = useCurrentPopupContext();
  const recordData = useCollectionRecordData();
  const tableBlockContextBasicValue = useTableBlockContext();
  if (recordData) {
    return false;
  }

  const popupTableBlockContext = getStoredPopupContext(params?.popupuid)?.tableBlockContext;
  return !isEmpty(popupTableBlockContext) || !isEmpty(tableBlockContextBasicValue);
};

export const useCustomRequestVariableOptions = () => {
  const collection = useCollection_deprecated();
  const { t } = useTranslation();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const userFieldOptions = useCollectionFilterOptions('users', DEFAULT_DATA_SOURCE_KEY);
  const compile = useCompile();
  const recordData = useCollectionRecordData();
  const { name: blockType } = useBlockContext() || {};
  const { form } = useFormBlockContext();
  const [fields, userFields] = useMemo(() => {
    return [compile(fieldsOptions), compile(userFieldOptions)];
  }, [fieldsOptions, userFieldOptions]);
  const environmentVariables = useGlobalVariable('$env');
  const contextVariable = useContextAssociationFields({ maxDepth: 2, contextCollectionName: collection.name });
  const shouldShowTableSelectVariable = useIsShowTableSelectRecord();
  return useMemo(() => {
    return [
      environmentVariables,
      recordData && {
        name: 'currentRecord',
        title: t('Current record', { ns: 'client' }),
        children: [...fields],
      },
      (blockType === 'form' || form) && {
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
      shouldShowTableSelectVariable && { ...contextVariable, name: '$nSelectedRecord', title: contextVariable.label },
    ].filter(Boolean);
  }, [recordData, t, fields, blockType, userFields, shouldShowTableSelectVariable]);
};
