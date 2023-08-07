export * from './ExportActionInitializer';
export * from './ExportDesigner';
export * from './ExportInitializerProvider';
export * from './ExportPluginProvider';
export * from './useExportAction';
import { Plugin } from '@nocobase/client';
import { ExportPluginProvider } from './ExportPluginProvider';

export class ExportPlugin extends Plugin {
  async load() {
    this.app.use(ExportPluginProvider);
  }
}

export default ExportPlugin;
