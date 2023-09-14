import { Plugin } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';

export class FileManagerPlugin extends Plugin {
  async load() {
    this.app.use(FileManagerProvider);
  }
}

export default FileManagerPlugin;
