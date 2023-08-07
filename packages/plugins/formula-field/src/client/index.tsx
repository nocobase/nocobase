import { Plugin } from '@nocobase/client';
import { FormulaFieldProvider } from './FormulaFieldProvider';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.use(FormulaFieldProvider);
  }
}

export default FormulaFieldPlugin;
