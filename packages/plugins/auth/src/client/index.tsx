import { Plugin } from '@nocobase/client';
import { AuthProvider } from './AuthProvider';

export class AuthPlugin extends Plugin {
  async load() {
    this.app.use(AuthProvider);
  }
}

export default AuthPlugin;
