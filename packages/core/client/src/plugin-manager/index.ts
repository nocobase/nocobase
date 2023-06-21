export * from './context';
export * from './PinnedPluginListProvider';

import { Plugin } from '../application-v2';
import { PinnedPluginListProvider } from './PinnedPluginListProvider';

export class PinnedPluginListPlugin extends Plugin {
  async load() {
    this.app.use(PinnedPluginListProvider, this.options);
  }
}
