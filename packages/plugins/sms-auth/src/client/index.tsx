import { Plugin } from '@nocobase/client';
import { SmsAuthProvider } from './SmsAuthProvider';

export class SmsAuthPlugin extends Plugin {
  async load() {
    this.app.use(SmsAuthProvider);
  }
}

export default SmsAuthPlugin;
