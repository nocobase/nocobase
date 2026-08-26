/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { FlowSettingsContextProvider, useFlowSettingsContext } from '@nocobase/flow-engine';

export const createKanbanQuickCreatePopupTemplateShadowCtx = (ctx: any) => {
  const shadowModel = Object.create(ctx?.model || {});
  Object.defineProperty(shadowModel, 'use', {
    value: 'KanbanQuickCreateActionModel',
    configurable: true,
  });

  const shadowCtx = Object.create(ctx || {});
  Object.defineProperty(shadowCtx, 'model', {
    value: shadowModel,
    configurable: true,
  });

  return shadowCtx;
};

const quickCreatePopupTemplateComponentCache = new WeakMap<object, React.ComponentType<any>>();

export const getKanbanQuickCreatePopupTemplateComponent = (Component: any) => {
  if (!Component || typeof Component === 'string' || typeof Component !== 'function') {
    return Component;
  }

  const cacheKey = Component as object;
  const cached = quickCreatePopupTemplateComponentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const WrappedComponent = function KanbanQuickCreatePopupTemplateComponent(props: any) {
    const ctx = useFlowSettingsContext();
    const shadowCtx = useMemo(() => createKanbanQuickCreatePopupTemplateShadowCtx(ctx), [ctx]);

    return (
      <FlowSettingsContextProvider value={shadowCtx}>
        <Component {...props} />
      </FlowSettingsContextProvider>
    );
  };

  WrappedComponent.displayName = `KanbanQuickCreatePopupTemplate(${
    Component.displayName || Component.name || 'Component'
  })`;
  quickCreatePopupTemplateComponentCache.set(cacheKey, WrappedComponent);
  return WrappedComponent;
};
