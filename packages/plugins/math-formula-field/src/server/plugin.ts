import { InstallOptions, Plugin } from '@nocobase/server';
import { MathFormulaField } from './math-formula-field';

export class MathFormulaFieldPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      mathFormula: MathFormulaField,
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MathFormulaFieldPlugin;
