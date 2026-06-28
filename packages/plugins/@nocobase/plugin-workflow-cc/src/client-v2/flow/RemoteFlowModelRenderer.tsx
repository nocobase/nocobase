/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SkeletonFallback } from '@nocobase/client-v2';
import { FlowModelRenderer, useFlowEngine, useFlowViewContext, type FlowModel } from '@nocobase/flow-engine';
import React, { useEffect, useRef, useState } from 'react';

export function RemoteFlowModelRenderer({
  enableUIConfiguration = false,
  mapModel = (model: FlowModel) => model,
  onModelLoaded,
  reloadKey,
  uid,
  useCache = false,
}: {
  enableUIConfiguration?: boolean;
  mapModel?: (model: FlowModel) => FlowModel;
  onModelLoaded?: (model: FlowModel) => void;
  reloadKey?: string | number;
  uid: string;
  useCache?: boolean;
}) {
  const [model, setModel] = useState<FlowModel>(null);
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const onModelLoadedRef = useRef(onModelLoaded);
  const mapModelRef = useRef(mapModel);
  const modelRef = useRef<FlowModel | null>(null);
  const enableUIConfigurationRef = useRef(enableUIConfiguration);

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
        value: enableUIConfigurationRef.current,
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
  }, [flowEngine, reloadKey, uid, viewCtx]);

  useEffect(() => {
    enableUIConfigurationRef.current = enableUIConfiguration;
    if (modelRef.current) {
      modelRef.current.context.defineProperty('flowSettingsEnabled', {
        value: enableUIConfiguration,
      });
    }
  }, [enableUIConfiguration]);

  return (
    <FlowModelRenderer
      fallback={<SkeletonFallback />}
      hideRemoveInSettings
      model={model}
      showFlowSettings={false}
      useCache={useCache}
    />
  );
}
