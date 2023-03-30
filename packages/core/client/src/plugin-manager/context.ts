import { createContext } from 'react';

export const PluginManagerContext = createContext<any>({});
export const PinnedPluginListContext = createContext({ items: {} });
