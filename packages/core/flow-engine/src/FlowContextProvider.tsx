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
import { FlowView, FlowViewer } from './views/FlowView';

export const FlowReactContext = createContext<FlowContext>(null);
export const FlowViewContext = createContext<FlowContext>(null);

export function FlowContextProvider(props: { children: React.ReactNode; context: FlowContext }) {
  return <FlowReactContext.Provider value={props.context}>{props.children}</FlowReactContext.Provider>;
}

export const FlowViewContextProvider = React.memo((props: { children: React.ReactNode; context: FlowContext }) => {
  return (
    <FlowViewContext.Provider value={props.context}>
      <FlowReactContext.Provider value={props.context}>{props.children}</FlowReactContext.Provider>
    </FlowViewContext.Provider>
  );
});

FlowViewContextProvider.displayName = 'FlowViewContextProvider';

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

/**
 * Access the `FlowViewer` that opens new drawers / modals / pages (`viewer.drawer({...})`, `viewer.modal({...})`, etc.). This is the counterpart to `useFlowView()`: `useFlowView()` returns the *current* mounted view (use it to close yourself, render Header/Footer slots, etc.), while `useFlowViewer()` returns the surface that lets you open a *new* view from inside any flow-context subtree.
 */
export function useFlowViewer() {
  const ctx = useFlowContext();
  return ctx.viewer as FlowViewer;
}
