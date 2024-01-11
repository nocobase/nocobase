import { Plugin } from '@nocobase/client';
import { FormulaFieldProvider } from './FormulaFieldProvider';
import formulaField from './interfaces/formula';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(FormulaFieldProvider);
    this.app.collectionManager.addCollectionFieldInterfaces([formulaField]);
  }
}

export default FormulaFieldPlugin;
