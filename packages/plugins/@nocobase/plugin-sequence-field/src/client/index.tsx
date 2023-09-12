import { Plugin } from '@nocobase/client';
import { SequenceFieldProvider } from './SequenceFieldProvider';

export class SequenceFieldPlugin extends Plugin {
  async load() {
    this.app.use(SequenceFieldProvider);
  }
}

export default SequenceFieldPlugin;
