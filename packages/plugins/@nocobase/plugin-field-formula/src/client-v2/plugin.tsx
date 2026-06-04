/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { FormulaFieldInterface, formulaDateOperators } from './interfaces/formula';
import { FormulaExpression } from './components';

export class PluginFieldFormulaClient extends Plugin<any, Application> {
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
      FormulaExpression,
    });
    this.app.registerFieldFilterOperatorGroup('formulaDate', formulaDateOperators);
    this.app.addFieldInterfaces([FormulaFieldInterface]);
    this.flowEngine.context.defineProperty('fieldFormula', {
      get: () => ({
        expressionFields: this.expressionFields,
        registerExpressionFieldInterface: this.registerExpressionFieldInterface.bind(this),
      }),
    });
    this.flowEngine.registerModelLoaders({
      FormulaFieldModel: {
        loader: () => import('./models/FormulaFieldModel'),
      },
    });
  }
}

export default PluginFieldFormulaClient;
