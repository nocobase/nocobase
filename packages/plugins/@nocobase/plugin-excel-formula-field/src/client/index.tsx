import { Plugin } from '@nocobase/client';
import { ExcelFormulaFieldProvider } from './ExcelFormulaFieldProvider';
import { excelFormula } from './excel-formula';

export class ExcelFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(ExcelFormulaFieldProvider);
    this.app.collectionManager.addFieldInterfaces([excelFormula]);
  }
}

export default ExcelFormulaFieldPlugin;
