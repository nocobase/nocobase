/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import type { FlowModel } from '@nocobase/flow-engine';
import React, { useEffect } from 'react';
import { isRouteContentConfirmed } from './FlowModelRepository';

// Keep the current renderer mounted while the first editor confirms the stored page or grid.
export function useRouteContentRequest(
  load: (forEditing: boolean) => Promise<FlowModel>,
  editing: boolean,
  refreshDeps: unknown[],
) {
  const { data, error, loading, refresh } = useRequest(
    async () => ({ model: await load(editing), confirmed: editing, refreshDeps }),
    { refreshDeps },
  );
  const current = data && refreshDeps.every((dep, i) => Object.is(dep, data.refreshDeps[i])) ? data : undefined;
  const needsConfirmation =
    editing && !!current?.model && !current.confirmed && !isRouteContentConfirmed(current.model);
  useEffect(() => {
    if (needsConfirmation && !loading && !error) refresh();
  }, [needsConfirmation, loading, error, refresh]);

  return { model: current?.model, error, loading, needsConfirmation };
}

export function RouteContent({ pending, children }: React.PropsWithChildren<{ pending: boolean }>) {
  // React 18 forwards inert as a string attribute. Keep the same DOM and component state during initialization.
  return (
    <div style={{ display: 'contents' }} {...(pending ? { inert: '' } : {})}>
      {children}
    </div>
  );
}
