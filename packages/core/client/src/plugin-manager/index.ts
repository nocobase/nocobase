export * from './context';
export * from './PinnedPluginListProvider';

import { Plugin } from '../application/Plugin';
import { PinnedPluginListProvider } from './PinnedPluginListProvider';

export class PinnedListPlugin extends Plugin {
  async load() {
    this.app.use(PinnedPluginListProvider, this.options.config);
  }
}
