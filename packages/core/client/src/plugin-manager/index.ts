export * from './context';
export * from './PinnedPluginListProvider';

import { Plugin } from '../application-v2/Plugin';
import { PinnedPluginListProvider } from './PinnedPluginListProvider';

export class PinnedPluginListPlugin extends Plugin {
  async load() {
    this.app.use(PinnedPluginListProvider, this.options);
  }
}
