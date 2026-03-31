/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useMemo } from 'react';
import { useAllAccessDesktopRoutes } from '.';
import { useAPIClient } from '../../../api-client/hooks/useAPIClient';

export function useDeleteRouteSchema(collectionName = 'uiSchemas') {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);
  const { refresh: refreshMenu } = useAllAccessDesktopRoutes();

  const deleteRouteSchema = useCallback(
    async (schemaUid: string) => {
      if (!schemaUid) {
        return;
      }

      const res = await resource[`remove/${schemaUid}`]();
      refreshMenu();
      return res;
    },
    [resource, refreshMenu],
  );

  return { deleteRouteSchema };
}
