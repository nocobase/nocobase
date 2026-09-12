/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import RequestInstruction from './RequestInstruction';

type WorkflowPluginLike = {
  registerInstruction?: (type: string, instruction: typeof RequestInstruction) => void;
};

export default class PluginWorkflowRequestClientV2 extends Plugin<any, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPluginLike | undefined;
    workflow?.registerInstruction?.('request', RequestInstruction);
  }
}
