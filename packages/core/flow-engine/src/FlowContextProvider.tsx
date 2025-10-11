/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { FlowContext, FlowEngineContext } from './flowContext';
import { FlowView } from './views/FlowView';

export const FlowReactContext = createContext<FlowContext>(null);
export const FlowViewContext = createContext<FlowContext>(null);

export function FlowContextProvider(props: { children: React.ReactNode; context: FlowContext }) {
  return <FlowReactContext.Provider value={props.context}>{props.children}</FlowReactContext.Provider>;
}

export function FlowViewContextProvider(props: { children: React.ReactNode; context: FlowContext }) {
  return (
    <FlowViewContext.Provider value={props.context}>
      <FlowReactContext.Provider value={props.context}>{props.children}</FlowReactContext.Provider>
    </FlowViewContext.Provider>
  );
}

export function useFlowContext<T = FlowEngineContext>() {
  return useContext(FlowReactContext) as T;
}

export function useFlowViewContext<T = FlowEngineContext>() {
  return useContext(FlowViewContext) as T;
}

export function useFlowView() {
  const ctx = useFlowContext();
  return ctx.view as FlowView;
}
