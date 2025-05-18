import React, { createContext, useContext } from 'react';
import { FlowEngine } from './flow-engine';

interface FlowEngineProviderProps {
  engine: FlowEngine;
  children: React.ReactNode;
}

const FlowEngineContext = createContext<FlowEngine | null>(null);

export const FlowEngineProvider: React.FC<FlowEngineProviderProps> = (props) => {
  const { engine, children } = props;

  // engine is now guaranteed to be provided by props.
  // No need for useMemo here as the stability of the engine instance 
  // is the responsibility of the parent component providing it.
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