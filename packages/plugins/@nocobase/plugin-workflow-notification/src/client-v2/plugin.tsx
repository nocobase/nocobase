/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import NotificationInstruction from './NotificationInstruction';

type WorkflowPluginLike = {
  registerInstruction?: (type: string, instruction: typeof NotificationInstruction) => void;
};

export class PluginWorkflowNotificationClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPluginLike | undefined;
    workflow?.registerInstruction?.('notification', NotificationInstruction);
  }
}

export default PluginWorkflowNotificationClientV2;
