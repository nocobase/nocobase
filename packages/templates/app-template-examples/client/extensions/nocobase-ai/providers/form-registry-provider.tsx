import { useMemo, type PropsWithChildren } from 'react';
import { AIFormRegistry, AIFormRegistryContext } from './form-registry.js';

export function AIFormRegistryProvider({ children }: PropsWithChildren) {
  const registry = useMemo(() => new AIFormRegistry(), []);
  return (
    <AIFormRegistryContext.Provider value={registry}>
      {children}
    </AIFormRegistryContext.Provider>
  );
}
