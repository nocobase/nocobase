import { usePlugin } from '@nocobase/client';
import { PluginFieldMarkdownVditorClient } from '../';

export const useCDN = () => {
  const plugin = usePlugin(PluginFieldMarkdownVditorClient);
  return plugin.getCDN();
};
