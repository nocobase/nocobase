import { createContext, useContext, type Context, type ReactNode } from 'react';

/** The published mode for this client application, shared by all plugin consumers. */
export const DemoModeContext: Context<boolean> = createContext(false);

/** The application's loading UI for automatic demo entry; the plugin supplies no presentation. */
export const DemoEntryLoadingContext: Context<ReactNode> =
  createContext<ReactNode>(null);

/** Reads the startup mode without requests; false when the plugin provider is absent. */
export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
