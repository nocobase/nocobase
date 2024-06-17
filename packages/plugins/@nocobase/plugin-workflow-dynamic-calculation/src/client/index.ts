/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import DynamicCalculation from './DynamicCalculation';
import { DynamicExpression } from './DynamicExpression';
import { ExpressionFieldInterface } from './expression';
import { ExpressionCollectionTemplate } from './ExpressionCollectionTemplate';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.dataSourceManager.addFieldInterfaces([ExpressionFieldInterface]);
    this.app.addComponents({
      DynamicExpression,
    });

    this.dataSourceManager.addCollectionTemplates([ExpressionCollectionTemplate]);

    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    const dynamicCalculation = new DynamicCalculation();
    workflow.instructions.register(dynamicCalculation.type, dynamicCalculation);
  }
}
