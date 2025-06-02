/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine, useFlowModel } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';

function InternalFlowPage({ uid }) {
  const model = useFlowModel(uid);
  return <FlowModelRenderer model={model} showFlowSettings />;
}

export const FlowPage = () => {
  const flowEngine = useFlowEngine();
  const params = useParams();
  const { loading } = useRequest(
    () => {
      return flowEngine.loadOrCreateModel({
        uid: params.name,
        use: 'PageFlowModel',
        stepParams: {},
        tabs: [
          {
            use: 'PageTabFlowModel',
            // stepParams: {},
            grid: {
              use: 'BlockGridFlowModel',
            },
          },
        ],
      });
    },
    {
      refreshDeps: [params.name],
    },
  );
  if (loading) {
    return <Spin />;
  }
  return <InternalFlowPage uid={params.name} />;
};
