/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, type ToolsUIProperties } from '@nocobase/client-v2';

type RefreshHandler = () => void | Promise<void>;

const dataModelingRefreshHandlers = new Set<RefreshHandler>();

export function registerDataModelingRefreshHandler(handler: RefreshHandler) {
  dataModelingRefreshHandlers.add(handler);
  return () => {
    dataModelingRefreshHandlers.delete(handler);
  };
}

export const useDataModelingOnOk = (decisions: ToolsUIProperties['decisions'], adjustArgs: Record<string, unknown>) => {
  const app = useApp();
  return {
    onOk: async () => {
      await decisions.edit(adjustArgs);
      await app.dataSourceManager.getDataSource?.('main')?.reload?.();
      await Promise.all([...dataModelingRefreshHandlers].map((refresh) => refresh()));
    },
  };
};
