import { Plugin } from '@nocobase/client';
import { FormulaFieldProvider } from './FormulaFieldProvider';
import { FormulaFieldInterface } from './interfaces/formula';
import { Formula } from './components';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(FormulaFieldProvider);
    this.app.addComponents({ Formula })
    this.app.dataSourceManager.addFieldInterfaces([FormulaFieldInterface]);
  }
}

export default FormulaFieldPlugin;
