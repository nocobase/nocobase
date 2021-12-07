import { PluginOptions } from '@nocobase/server';
import _export from './actions/export';

export const ACTION_NAME_EXPORT = 'export';

export default {
  name: 'export',
  async load() {
    const resourcer = this.app.resourcer;
    resourcer.registerActionHandler(ACTION_NAME_EXPORT, _export);
  },
} as PluginOptions;
