/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transactionable } from '@nocobase/database';
import type Plugin from '../Plugin';
import type { WorkflowModel } from '../types';
import Processor from '../Processor';

export abstract class Trigger {
  constructor(public readonly workflow: Plugin) {}
  on(workflow: WorkflowModel): void {}
  off(workflow: WorkflowModel): void {}
  validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): boolean | Promise<boolean> {
    return true;
  }
  duplicateConfig?(workflow: WorkflowModel, options: Transactionable): object | Promise<object>;
  validateContext?(values: any, workflow: WorkflowModel): null | void | { [key: string]: string };
  sync?: boolean;
  execute?(
    workflow: WorkflowModel,
    values: any,
    options: Transactionable,
  ): void | Processor | Promise<void | Processor>;
}

export default Trigger;
