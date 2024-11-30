/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useUpdate } from 'ahooks';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useRefreshFieldSchema } from '../formily/NocoBaseRecursionField';
import { ISchemaComponentContext } from './types';

export const SchemaComponentContext = createContext<ISchemaComponentContext>({});
SchemaComponentContext.displayName = 'SchemaComponentContext.Provider';

/**
 * Get a new refresh context, used to refresh the component that uses this hook
 * @returns
 */
export const useNewRefreshContext = (refresh?: () => void) => {
  const oldCtx = useContext(SchemaComponentContext);
  const newCtx = useMemo(() => ({ ...oldCtx }), [oldCtx]);
  const refreshFieldSchema = useRefreshFieldSchema();
  const update = useUpdate();

  const _refresh = useCallback(
    (options?: { refreshParent?: boolean }) => {
      // refresh fieldSchema context value
      refreshFieldSchema(options);
      // refresh current component
      update();
      // custom refresh
      refresh?.();
    },
    [refreshFieldSchema, update, refresh],
  );

  if (oldCtx) {
    Object.assign(newCtx, oldCtx);
    newCtx.refresh = _refresh;
  }

  return newCtx;
};
