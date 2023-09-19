import React, { useContext } from 'react';

export const FlowContext = React.createContext<any>({});

export function useFlowContext() {
  return useContext(FlowContext);
}
