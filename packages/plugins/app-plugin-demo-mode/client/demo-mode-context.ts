import { createContext, type Context } from 'react';

/** The public server status, shared by the plugin provider and the application's header entry. */
export const DemoModeContext: Context<boolean | undefined> = createContext<
  boolean | undefined
>(undefined);
