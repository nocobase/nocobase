import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { MathFormulaField } from './math-formula-field';

export class MathFormulaFieldPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      formula: MathFormulaField,
      mathFormula: MathFormulaField,
    });

    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MathFormulaFieldPlugin;
