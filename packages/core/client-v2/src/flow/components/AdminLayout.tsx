/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine, FlowModelRenderer } from '@nocobase/flow-engine';
import React, { type FC } from 'react';
import { getAdminLayoutModel, AdminLayoutModel } from '..';

const AdminLayout: FC = (props) => {
  const flowEngine = useFlowEngine();
  const model = getAdminLayoutModel(flowEngine, {
    create: true,
    props,
    use: AdminLayoutModel,
  });

  if (!model) {
    throw new Error('[NocoBase] Failed to create admin-layout-model.');
  }

  return <FlowModelRenderer model={model} />;
};

export default AdminLayout;
