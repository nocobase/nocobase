/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm, useFieldSchema } from '@formily/react';
import {
  getStoredPopupContext,
  useCollection,
  useCollectionRecord,
  useCollectionRecordData,
  useContextAssociationFields,
  useCurrentPopupContext,
  useTableBlockContext,
  useVariableOptions,
} from '@nocobase/client';
import { useMemo } from 'react';
import { isEmpty } from 'lodash';

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

export const useAIEmployeeButtonVariableOptions = () => {
  const schema = useFieldSchema();
  const record = useCollectionRecord();
  const form = useForm();
  const collection = useCollection();
  const options = useVariableOptions({
    collectionField: { uiSchema: schema },
    form,
    record,
    uiSchema: schema,
  });
  const contextVariable = useContextAssociationFields({ maxDepth: 2, contextCollectionName: collection.name });
  const showTableSelectRecord = useIsShowTableSelectRecord();

  return useMemo(
    () =>
      [
        ...options,
        showTableSelectRecord && {
          key: '$nSelectedRecord',
          value: '$nSelectedRecord',
          ...contextVariable,
        },
      ].filter(Boolean),
    [options, contextVariable, showTableSelectRecord],
  );
};
