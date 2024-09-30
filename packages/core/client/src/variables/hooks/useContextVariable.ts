/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useTableBlockContext } from '../../block-provider/TableBlockProvider';
import { useCurrentPopupContext } from '../../schema-component/antd/page/PagePopups';
import { getStoredPopupContext } from '../../schema-component/antd/page/pagePopupUtils';
import { usePopupSettings } from '../../schema-component/antd/page/PopupSettingsProvider';
import { VariableOption } from '../types';

const useContextVariable = (): VariableOption => {
  let tableBlockContext;

  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { params } = useCurrentPopupContext();
  const _tableBlockContext = useTableBlockContext();

  if (isPopupVisibleControlledByURL()) {
    tableBlockContext = getStoredPopupContext(params?.popupuid)?.tableBlockContext;
  } else {
    tableBlockContext = _tableBlockContext;
  }

  const { field, service, rowKey, collection: collectionName } = tableBlockContext || {};

  const contextData = useMemo(
    () => service?.data?.data?.filter((v) => (field?.data?.selectedRowKeys || [])?.includes(v[rowKey])),
    [field?.data?.selectedRowKeys, rowKey, service?.data?.data],
  );

  return useMemo(() => {
    return {
      name: '$context',
      ctx: contextData,
      collectionName,
    };
  }, [collectionName, contextData]);
};

export default useContextVariable;
