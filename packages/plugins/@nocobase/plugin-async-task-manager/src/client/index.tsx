import { Plugin } from '@nocobase/client';
import { AsyncTaskManagerProvider } from './AsyncTaskManagerProvider';
import { TaskResultRendererManager } from './TaskResultRendererManager';

export class PluginAsyncExportClient extends Plugin {
  taskResultRendererManager: TaskResultRendererManager = new TaskResultRendererManager();

  async load() {
    this.app.use(AsyncTaskManagerProvider);
  }
}

export default PluginAsyncExportClient;
