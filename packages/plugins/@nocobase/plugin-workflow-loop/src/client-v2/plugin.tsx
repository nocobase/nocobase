/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';
import LoopInstruction from './nodes/loop';

export class PluginWorkflowLoopClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as PluginWorkflowClientV2 | undefined;
    workflow?.registerInstruction?.('loop', LoopInstruction);
  }
}

export default PluginWorkflowLoopClientV2;
