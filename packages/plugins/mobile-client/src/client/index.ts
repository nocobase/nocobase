import { Plugin } from '@nocobase/client';
import { MobileClientProvider } from './MobileClientProvider';

export class MobileClientPlugin extends Plugin {
  async load() {
    this.app.use(MobileClientProvider);
  }
}

export default MobileClientPlugin;
