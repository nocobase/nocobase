/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { FlowEngine } from './flowEngine';
import useDrawer from './useDrawer';
import usePopover from './usePopover';

interface FlowEngineProviderProps {
  engine: FlowEngine;
  children: React.ReactNode;
}

const FlowEngineContext = createContext<FlowEngine | null>(null);

export const FlowEngineProvider: React.FC<FlowEngineProviderProps> = (props) => {
  const { engine, children } = props;
  if (!engine) {
    throw new Error('FlowEngineProvider must be supplied with an engine.');
  }
  return <FlowEngineContext.Provider value={engine}>{children}</FlowEngineContext.Provider>;
};

export const FlowEngineGlobalsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { modal, message, notification } = App.useApp();
  const [drawer, contextHolder] = useDrawer();
  const [popover, popoverContextHolder] = usePopover();
  const engine = useFlowEngine();
  const config = useContext(ConfigProvider.ConfigContext);

  useEffect(() => {
    engine.context['antdConfig'] = config;
    engine.context['drawer'] = drawer;
    engine.context['modal'] = modal;
    engine.context['message'] = message;
    engine.context['notification'] = notification;
    engine.context['popover'] = popover;
  }, [engine, drawer, modal, message, notification, config, popover]);

  return (
    <>
      {children}
      {contextHolder as any}
      {popoverContextHolder as any}
    </>
  );
};

export const useFlowEngine = (): FlowEngine => {
  const context = useContext(FlowEngineContext);
  if (!context) {
    // This error should ideally not be hit if FlowEngineProvider is used correctly at the root
    // and always supplied with an engine.
    throw new Error(
      'useFlowEngine must be used within a FlowEngineProvider, and FlowEngineProvider must be supplied with an engine.',
    );
  }
  return context;
};
