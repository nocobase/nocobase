import { InstallOptions, Plugin } from '@nocobase/server';
import { ExcelFormulaField } from './excel-formula-field';

export class ExcelFormulaFieldPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      excelFormula: ExcelFormulaField,
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ExcelFormulaFieldPlugin;
