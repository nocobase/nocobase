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

import DateCalculationInstruction from './DateCalculationInstruction';

export class PluginWorkflowDateCalculationClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow?.registerInstruction?.('dateCalculation', DateCalculationInstruction);
  }
}

export default PluginWorkflowDateCalculationClient;
