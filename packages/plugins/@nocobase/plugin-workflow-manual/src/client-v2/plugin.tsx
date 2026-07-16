/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, type Application } from '@nocobase/client-v2';
import { PluginWorkflowClientV2, type TaskTypeOptions } from '@nocobase/plugin-workflow/client-v2';

import { TASK_TYPE_MANUAL } from '../common/constants';
import { manualTaskType } from './tasks';

type WorkflowClientLike = {
  registerTaskType?: (key: string, options: TaskTypeOptions) => void;
};

export class PluginWorkflowManualClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const workflow =
      (this.app.pm.get(PluginWorkflowClientV2) as WorkflowClientLike | undefined) ??
      (this.app.pm.get('workflow') as WorkflowClientLike | undefined);

    workflow?.registerTaskType?.(TASK_TYPE_MANUAL, manualTaskType);
  }
}

export default PluginWorkflowManualClientV2;
