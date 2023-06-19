import { Plugin } from '@nocobase/client';
import { DuplicatorProvider } from './DuplicatorProvider';

export class DuplicatorPlugin extends Plugin {
  async load() {
    this.app.use(DuplicatorProvider);
  }
}

export default DuplicatorPlugin;
