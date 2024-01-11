import { Plugin } from '@nocobase/client';
import { MathFormulaFieldProvider } from './MathFormulaFieldProvider';
import { mathFormula } from './math-formula';

export class MathFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(MathFormulaFieldProvider);
    this.app.collectionManager.addFieldInterfaces([mathFormula]);
  }
}

export default MathFormulaFieldPlugin;
