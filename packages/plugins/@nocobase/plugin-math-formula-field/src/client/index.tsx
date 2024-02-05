import { Plugin } from '@nocobase/client';
import { MathFormulaFieldProvider } from './MathFormulaFieldProvider';
import { MathFormulaFieldInterface } from './math-formula';

export class MathFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(MathFormulaFieldProvider);
    this.app.dataSourceManager.addFieldInterfaces([MathFormulaFieldInterface]);
  }
}

export default MathFormulaFieldPlugin;
