import { Plugin } from '@nocobase/client';
import { SequenceFieldProvider } from './SequenceFieldProvider';
import { SequenceFieldInterface } from './sequence';

export class SequenceFieldPlugin extends Plugin {
  async load() {
    this.app.use(SequenceFieldProvider);
    this.app.dataSourceManager.addFieldInterfaces([SequenceFieldInterface]);
  }
}

export default SequenceFieldPlugin;
