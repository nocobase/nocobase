import { Plugin } from '@nocobase/client';
import { SamlProvider } from './SamlProvider';

export class SamlPlugin extends Plugin {
  async load() {
    this.app.use(SamlProvider);
  }
}

export default SamlPlugin;
