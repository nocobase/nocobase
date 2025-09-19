/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isEmpty } from 'lodash';

import { getStoredPopupContext, useCurrentPopupContext } from '../../schema-component';
import { useCollectionRecordData } from '../../data-source';
import { useTableBlockContext } from '../../block-provider';

export const useIsShowTableSelectRecord = () => {
  const { params } = useCurrentPopupContext();
  const recordData = useCollectionRecordData();
  const tableBlockContextBasicValue = useTableBlockContext();
  if (recordData) {
    return false;
  }

  const popupTableBlockContext = getStoredPopupContext(params?.popupuid)?.tableBlockContext;
  return !isEmpty(popupTableBlockContext) || !isEmpty(tableBlockContextBasicValue);
};
