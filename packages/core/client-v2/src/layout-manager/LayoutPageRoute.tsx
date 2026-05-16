/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { getLayoutModel } from '../flow/admin-shell/BaseLayoutModel';
import type { BaseLayoutModel } from '../flow/admin-shell/BaseLayoutModel';
import FlowRoute from '../flow/components/FlowRoute';

export interface LayoutPageRouteProps {
  layoutName: string;
}

export const LayoutPageRoute = (props: LayoutPageRouteProps) => {
  const { layoutName } = props;
  const app = useApp();
  const layout = app.layoutManager.getLayout(layoutName);
  const legacyPageBehavior = layout.name === 'admin' ? 'redirect' : 'notFound';
  const getCurrentLayoutModel = useMemo(
    () => (flowEngine: FlowEngine) => getLayoutModel<BaseLayoutModel>(flowEngine, layout.uid, { required: true }),
    [layout.uid],
  );

  return <FlowRoute getLayoutModel={getCurrentLayoutModel} legacyPageBehavior={legacyPageBehavior} />;
};

export default LayoutPageRoute;
