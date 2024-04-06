import { Plugin } from '@nocobase/client';
import { Formula } from './components';
import { renderExpressionDescription } from './scopes';
import { FormulaFieldInterface } from './interfaces/formula';

export class FormulaFieldPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      Formula,
    });
    this.app.addScopes({
      renderExpressionDescription,
    });
    this.app.dataSourceManager.addFieldInterfaces([FormulaFieldInterface]);
  }
}

export default FormulaFieldPlugin;
