import { Plugin } from '@nocobase/client';
import { VerificationProvider } from './VerificationProvider';

export class VerificationPlugin extends Plugin {
  async load() {
    this.app.use(VerificationProvider);
  }
}

export default VerificationPlugin;
