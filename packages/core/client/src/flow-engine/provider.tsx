import React, { createContext, useContext } from 'react';
import { FlowEngine } from './flowEngine';

interface FlowEngineProviderProps {
  engine: FlowEngine;
  children: React.ReactNode;
}

const FlowEngineContext = createContext<FlowEngine | null>(null);

export const FlowEngineProvider: React.FC<FlowEngineProviderProps> = (props) => {
  const { engine, children } = props;
  return <FlowEngineContext.Provider value={engine}>{children}</FlowEngineContext.Provider>;
};

export const useFlowEngine = (): FlowEngine => {
  const context = useContext(FlowEngineContext);
  if (!context) {
    // This error should ideally not be hit if FlowEngineProvider is used correctly at the root
    // and always supplied with an engine.
    throw new Error('useFlowEngine must be used within a FlowEngineProvider, and FlowEngineProvider must be supplied with an engine.');
  }
  return context;
}; 