// i18n.addResources('zh-CN', NAMESPACE, zhCN);
// i18n.addResources('en-US', NAMESPACE, enUS);

export * from './ImportActionInitializer';
export * from './ImportDesigner';
export * from './ImportInitializerProvider';
export * from './ImportPluginProvider';
export * from './useImportAction';

import { Plugin } from '@nocobase/client';
import { ImportPluginProvider } from './ImportPluginProvider';

export class ImportPlugin extends Plugin {
  async load() {
    this.app.use(ImportPluginProvider);
  }
}

export default ImportPlugin;
