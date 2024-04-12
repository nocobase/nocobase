import { Plugin } from '@nocobase/client';
import { Formula } from './components';
import { renderExpressionDescription } from './scopes';
import { FormulaFieldInterface } from './interfaces/formula';
import { FormulaComponentFieldSettings } from './FormulaComponentFieldSettings';

export class PluginFormulaFieldClient extends Plugin {
  async load() {
    this.app.addComponents({
      Formula,
    });
    this.app.addScopes({
      renderExpressionDescription,
    });
    this.app.dataSourceManager.addFieldInterfaces([FormulaFieldInterface]);
    this.app.schemaSettingsManager.add(FormulaComponentFieldSettings);
  }
}

export default PluginFormulaFieldClient;
