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

function InternalFlowPage({ uid, extraContext }) {
  const model = useFlowModel(uid);
  return <FlowModelRenderer model={model} showFlowSettings hideRemoveInSettings extraContext={extraContext} />;
}

export const FlowPage = () => {
  const params = useParams();
  return <FlowPageComponent uid={params.name} extraContext={{}} />;
};

export const FlowPageComponent = ({ uid, extraContext }) => {
  const flowEngine = useFlowEngine();
  const { loading } = useRequest(
    () => {
      return flowEngine.loadOrCreateModel({
        uid: uid,
        use: 'PageFlowModel',
        subModels: {
          tabs: [
            {
              use: 'PageTabFlowModel',
              subModels: {
                grid: {
                  use: 'BlockGridFlowModel',
                },
              },
            },
          ],
        },
      });
    },
    {
      refreshDeps: [uid],
    },
  );
  if (loading) {
    return <Spin />;
  }
  return <InternalFlowPage uid={uid} extraContext={extraContext} />;
};
