/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, useFlowEngine, useFlowViewContext } from '@nocobase/flow-engine';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

export function RemoteFlowModelRenderer({
  uid,
  onModelLoaded,
  enableUIConfiguration = false,
  mapModel = _.identity,
  useCache = false,
}: {
  uid: string;
  onModelLoaded?: (model: FlowModel) => void;
  enableUIConfiguration?: boolean;
  mapModel?: (model: FlowModel) => FlowModel;
  useCache?: boolean;
}) {
  const [model, setModel] = useState<FlowModel>(null);
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();

  useEffect(() => {
    const run = async () => {
      let loadedModel = await flowEngine.loadModel({ uid });
      if (loadedModel) {
        loadedModel = mapModel(loadedModel);
        if (viewCtx) {
          loadedModel.context.addDelegate(viewCtx);
        }
        loadedModel.context.defineProperty('flowSettingsEnabled', {
          value: enableUIConfiguration,
        });
        setModel(loadedModel);
        if (onModelLoaded) {
          onModelLoaded(loadedModel);
        }
      }
    };
    run();
  }, [flowEngine, uid, viewCtx, onModelLoaded, enableUIConfiguration, mapModel]);

  return <FlowModelRenderer model={model} hideRemoveInSettings showFlowSettings={false} useCache={useCache} />;
}
