import { createContext, useContext, type Context } from 'react';

/** The published mode for this client application, shared by all plugin consumers. */
export const DemoModeContext: Context<boolean> = createContext(false);

/** Reads the startup mode without requests; false when the plugin provider is absent. */
export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
