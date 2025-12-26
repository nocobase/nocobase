/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Empty, Result, Skeleton } from 'antd';
import {
  FlowContext,
  type FlowEngine,
  FlowEngineProvider,
  type FlowModel,
  FlowModelRenderer,
  FlowViewContextProvider,
  createBlockScopedEngine,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { NAMESPACE } from '../locale';

export function ensureBlockScopedEngine(flowEngine: FlowEngine, scopedEngine?: FlowEngine): FlowEngine {
  return scopedEngine ?? createBlockScopedEngine(flowEngine);
}

export function ensureScopedEngineView(engine: FlowEngine, hostContext?: FlowContext): void {
  if (!engine?.context || !hostContext) return;
  const ctx = engine.context as any;
  if (typeof ctx.getPropertyOptions === 'function' && ctx.getPropertyOptions('view')) {
    return;
  }

  ctx.defineProperty('view', {
    cache: false,
    get: () => (hostContext as any).view,
  });
}

export function unlinkScopedEngine(engine?: FlowEngine): void {
  engine?.unlinkFromStack?.();
}

function tClient(model: { translate?: (key: string, options?: any) => string }, key: string) {
  const t = model?.translate;
  if (typeof t !== 'function') return key;
  return t(key, { ns: [NAMESPACE, 'client'] }) || key;
}

export function renderReferenceTargetPlaceholder(
  model: { translate?: (key: string, options?: any) => string },
  state: 'unconfigured' | 'invalid' | 'resolving',
) {
  if (state === 'unconfigured') {
    return (
      <Card>
        <div style={{ padding: 24 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tClient(model, 'Please configure target block')} />
        </div>
      </Card>
    );
  }

  if (state === 'resolving') {
    return (
      <Card>
        <div style={{ padding: 24 }}>
          <Skeleton active title={false} paragraph={{ rows: 3 }} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ padding: 24 }}>
        <Result status="error" subTitle={tClient(model, 'Target block is invalid')} />
      </div>
    </Card>
  );
}

// 桥接父视图上下文：
// - ctx.engine 指向 scoped engine；
// - 同时继承父级 view/popup 等变量。
export const RefViewBridge: React.FC<{ engine: FlowEngine; model: FlowModel }> = ({ engine, model }) => {
  const parentViewCtx = useFlowViewContext();
  const viewCtx = React.useMemo(() => {
    const c = new FlowContext();
    c.defineProperty('engine', { value: engine });
    c.addDelegate(engine.context);
    if (parentViewCtx && parentViewCtx instanceof FlowContext) {
      c.addDelegate(parentViewCtx);
    }
    return c;
  }, [engine, parentViewCtx]);

  return (
    <FlowViewContextProvider context={viewCtx}>
      <FlowModelRenderer key={model.uid} model={model} showFlowSettings={false} showErrorFallback />
    </FlowViewContextProvider>
  );
};

export const ReferenceScopedRenderer: React.FC<{ engine: FlowEngine; model: FlowModel }> = ({ engine, model }) => {
  return (
    <FlowEngineProvider engine={engine}>
      <RefViewBridge engine={engine} model={model} />
    </FlowEngineProvider>
  );
};
