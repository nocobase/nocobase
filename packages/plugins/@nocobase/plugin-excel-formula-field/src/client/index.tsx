import { Plugin } from '@nocobase/client';
import { ExcelFormulaFieldProvider } from './ExcelFormulaFieldProvider';
import { excelFormulaFieldInterface } from './excel-formula';

export class ExcelFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(ExcelFormulaFieldProvider);
    this.app.collectionManager.addCollectionFieldInterfaces([excelFormulaFieldInterface]);
  }
}

export default ExcelFormulaFieldPlugin;
