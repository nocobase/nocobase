/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { Formula } from './components';
import { FormulaComponentFieldSettings } from './FormulaComponentFieldSettings';
import { FormulaFieldInterface } from './interfaces/formula';
import { renderExpressionDescription } from './scopes';
import { FormulaFieldModel } from './FormulaFieldModel';
import { FlowModel } from '@nocobase/flow-engine';

export class PluginFieldFormulaClient extends Plugin {
  expressionFields = [
    'checkbox',
    'number',
    'percent',
    'integer',
    'number',
    'percent',
    'input',
    'textarea',
    'email',
    'phone',
    'date',
    'datetime',
    'datetimeNoTz',
    'unixTimestamp',
    'createdAt',
    'updatedAt',
    'radioGroup',
    'checkboxGroup',
    'select',
    'multipleSelect',
  ];
  registerExpressionFieldInterface(data: string | string[]) {
    if (Array.isArray(data)) {
      const result = this.expressionFields.concat(data);
      this.expressionFields = result;
    } else {
      this.expressionFields.push(data);
    }
  }
  async load() {
    this.app.addComponents({
      Formula,
    });
    this.app.addScopes({
      renderExpressionDescription,
    });
    this.app.dataSourceManager.addFieldInterfaces([FormulaFieldInterface]);
    this.app.schemaSettingsManager.add(FormulaComponentFieldSettings);
    this.flowEngine.registerModels({
      FormulaFieldModel,
    });
  }
}

export default PluginFieldFormulaClient;
