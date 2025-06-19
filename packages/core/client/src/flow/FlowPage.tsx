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
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';

function InternalFlowPage({ uid, sharedContext }) {
  const model = useFlowModel(uid);
  return <FlowModelRenderer model={model} sharedContext={sharedContext} showFlowSettings hideRemoveInSettings />;
}

export const FlowRoute = () => {
  const params = useParams();
  return <FlowPage uid={params.name} />;
};

export const FlowPage = (props) => {
  const { uid, parentId, sharedContext } = props;
  const flowEngine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      const options = {
        uid,
        use: 'PageModel',
        subModels: {
          tabs: [
            {
              use: 'PageTabModel',
              subModels: {
                grid: {
                  use: 'BlockGridModel',
                },
              },
            },
          ],
        },
      };
      if (!uid && parentId) {
        options['async'] = true;
        options['parentId'] = parentId;
        options['subKey'] = 'page';
        options['subType'] = 'object';
      }
      const data = await flowEngine.loadOrCreateModel(options);
      return data;
    },
    {
      refreshDeps: [uid || parentId],
    },
  );
  if (loading || !data?.uid) {
    return <Spin />;
  }
  return <InternalFlowPage uid={data.uid} sharedContext={sharedContext} />;
};
