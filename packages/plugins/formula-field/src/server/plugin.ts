import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { FormulaField } from './formula-field';
import { ExpressionField } from './expression-field';

export class FormulaFieldPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      formula: FormulaField,
      expression: ExpressionField
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

export default FormulaFieldPlugin;
