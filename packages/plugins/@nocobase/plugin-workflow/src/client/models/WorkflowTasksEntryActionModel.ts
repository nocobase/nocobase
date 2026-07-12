/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getWorkflowTasksPath } from '../../client-v2/constants';
import { WorkflowTasksEntryActionModel as WorkflowTasksEntryActionModelV2 } from '../../client-v2/models/WorkflowTasksEntryActionModel';

export class WorkflowTasksEntryActionModel extends WorkflowTasksEntryActionModelV2 {
  async onClick() {
    this.context.router.navigate(getWorkflowTasksPath());
  }
}

export default WorkflowTasksEntryActionModel;
