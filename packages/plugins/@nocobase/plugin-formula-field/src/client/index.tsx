import { Plugin } from '@nocobase/client';
import { FormulaFieldProvider } from './FormulaFieldProvider';
import { FormulaFieldInterface } from './interfaces/formula';
import { FormulaComponentFieldSettings } from './FormulaComponentFieldSettings';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(FormulaFieldProvider);
    this.app.dataSourceManager.addFieldInterfaces([FormulaFieldInterface]);
    this.app.schemaSettingsManager.add(FormulaComponentFieldSettings);
  }
}

export default FormulaFieldPlugin;
