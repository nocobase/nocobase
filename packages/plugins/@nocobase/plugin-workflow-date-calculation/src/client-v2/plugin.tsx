/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { Instruction } from '@nocobase/plugin-workflow/client-v2';
import DateCalculationInstruction from './nodes/dateCalculation';

type WorkflowPluginLike = {
  registerInstruction?: (type: string, instruction: Instruction | { new (): Instruction }) => void;
};

export class PluginWorkflowDateCalculationClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const workflow = (this.app.pm.get('workflow') || this.app.pm.get('@nocobase/plugin-workflow')) as
      | WorkflowPluginLike
      | undefined;

    workflow?.registerInstruction?.('dateCalculation', DateCalculationInstruction);
  }
}

export default PluginWorkflowDateCalculationClientV2;
