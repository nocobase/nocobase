import { Plugin } from '@nocobase/client';
import { MathFormulaFieldProvider } from './MathFormulaFieldProvider';

export class MathFormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(MathFormulaFieldProvider);
  }
}

export default MathFormulaFieldPlugin;
