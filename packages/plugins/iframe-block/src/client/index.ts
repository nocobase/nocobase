import { Plugin } from '@nocobase/client';
import { IframeBlockProvider } from './IframeBlockProvider';

export class IframeBlockPlugin extends Plugin {
  async load() {
    this.app.use(IframeBlockProvider);
  }
}

export default IframeBlockPlugin;
