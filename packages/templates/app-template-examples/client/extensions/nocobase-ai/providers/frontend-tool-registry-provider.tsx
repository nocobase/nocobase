import { useMemo, type PropsWithChildren } from 'react';
import {
  AIFrontendToolRegistry,
  AIFrontendToolRegistryContext,
} from './frontend-tool-registry.js';

export function AIFrontendToolRegistryProvider({
  children,
}: PropsWithChildren) {
  const registry = useMemo(() => new AIFrontendToolRegistry(), []);
  return (
    <AIFrontendToolRegistryContext.Provider value={registry}>
      {children}
    </AIFrontendToolRegistryContext.Provider>
  );
}
