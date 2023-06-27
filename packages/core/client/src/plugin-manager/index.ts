export * from './context';
export * from './PinnedPluginListProvider';

import { Plugin } from '../application-v2/Plugin';
import { PinnedPluginListProvider } from './PinnedPluginListProvider';

export class PinnedListPlugin extends Plugin {
  static pluginName = 'pinned-list';

  async load() {
    this.app.use(PinnedPluginListProvider, this.options.config);
  }
}
