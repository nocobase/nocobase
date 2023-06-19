import { Plugin } from '@nocobase/client';
import { ExcelFormulaFieldProvider } from './ExcelFormulaFieldProvider';

export class ExcelFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(ExcelFormulaFieldProvider);
  }
}

export default ExcelFormulaFieldPlugin;
