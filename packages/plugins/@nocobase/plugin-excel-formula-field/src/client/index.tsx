import { Plugin } from '@nocobase/client';
import { ExcelFormulaFieldProvider } from './ExcelFormulaFieldProvider';
import { ExcelFormulaFieldInterface } from './excel-formula';

export class ExcelFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(ExcelFormulaFieldProvider);
    this.app.dataSourceManager.addFieldInterfaces([ExcelFormulaFieldInterface]);
  }
}

export default ExcelFormulaFieldPlugin;
