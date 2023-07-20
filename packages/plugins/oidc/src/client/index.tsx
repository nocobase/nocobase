import { Plugin } from '@nocobase/client';
import { OidcProvider } from './OidcProvider';

export class OidcPlugin extends Plugin {
  async load() {
    this.app.use(OidcProvider);
  }
}

export default OidcPlugin;
