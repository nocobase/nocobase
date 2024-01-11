import { Plugin } from '@nocobase/client';
import { FormulaFieldProvider } from './FormulaFieldProvider';
import { FormulaFieldInterface } from './interfaces/formula';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(FormulaFieldProvider);
    this.app.collectionManager.addFieldInterfaces([FormulaFieldInterface]);
  }
}

export default FormulaFieldPlugin;
