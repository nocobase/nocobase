import { InstallOptions, Plugin } from '@nocobase/server';
import { ExcelFunctionField } from './excel-function-field';

export class ExcelFunctionFieldPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      excelFunction: ExcelFunctionField,
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ExcelFunctionFieldPlugin;
