import { Plugin } from '@nocobase/client';
import { SequenceFieldProvider } from './SequenceFieldProvider';
import { sequence } from './sequence';

export class SequenceFieldPlugin extends Plugin {
  async load() {
    this.app.use(SequenceFieldProvider);
    this.collectionManager.addCollectionFieldInterfaces([sequence]);
  }
}

export default SequenceFieldPlugin;
