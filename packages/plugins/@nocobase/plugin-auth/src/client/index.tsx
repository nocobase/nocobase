import { Plugin } from '@nocobase/client';
import { AuthPluginProvider } from './AuthPluginProvider';
import { AuthProvider } from './AuthProvider';

export class AuthPlugin extends Plugin {
  async load() {
    this.app.providers.unshift([AuthProvider, {}]);
    this.app.use(AuthPluginProvider);
  }
}

export default AuthPlugin;
