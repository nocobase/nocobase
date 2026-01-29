/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SkeletonFallback } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, useFlowEngine, useFlowViewContext } from '@nocobase/flow-engine';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

export function RemoteFlowModelRenderer({
  uid,
  onModelLoaded,
  enableUIConfiguration = false,
  mapModel = _.identity,
  useCache = false,
  reloadKey,
}: {
  uid: string;
  onModelLoaded?: (model: FlowModel) => void;
  enableUIConfiguration?: boolean;
  mapModel?: (model: FlowModel) => FlowModel;
  useCache?: boolean;
  reloadKey?: string | number;
}) {
  const [model, setModel] = useState<FlowModel>(null);
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const onModelLoadedRef = useRef(onModelLoaded);
  const mapModelRef = useRef(mapModel);
  const modelRef = useRef<FlowModel | null>(null);

  useEffect(() => {
    onModelLoadedRef.current = onModelLoaded;
  }, [onModelLoaded]);

  useEffect(() => {
    mapModelRef.current = mapModel;
  }, [mapModel]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!uid) {
        if (!cancelled) {
          setModel(null);
        }
        return;
      }
      let loadedModel = await flowEngine.loadModel({ uid });
      if (!loadedModel) {
        if (!cancelled) {
          setModel(null);
        }
        return;
      }
      loadedModel = mapModelRef.current ? mapModelRef.current(loadedModel) : loadedModel;
      if (viewCtx) {
        loadedModel.context.addDelegate(viewCtx);
      }
      loadedModel.context.defineProperty('flowSettingsEnabled', {
        value: enableUIConfiguration,
      });
      modelRef.current = loadedModel;
      if (!cancelled) {
        setModel(loadedModel);
        onModelLoadedRef.current?.(loadedModel);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [flowEngine, uid, viewCtx, reloadKey]);

  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.context.defineProperty('flowSettingsEnabled', {
      value: enableUIConfiguration,
    });
  }, [enableUIConfiguration]);

  return (
    <FlowModelRenderer
      model={model}
      hideRemoveInSettings
      showFlowSettings={false}
      useCache={useCache}
      fallback={<SkeletonFallback />}
    />
  );
}
