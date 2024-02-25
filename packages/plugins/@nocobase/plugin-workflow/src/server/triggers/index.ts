import { Transactionable } from '@nocobase/database';
import type Plugin from '../Plugin';
import type { WorkflowModel } from '../types';

export abstract class Trigger {
  constructor(public readonly workflow: Plugin) {}
  abstract on(workflow: WorkflowModel): void;
  abstract off(workflow: WorkflowModel): void;
  validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): boolean | Promise<boolean> {
    return true;
  }
  duplicateConfig?(workflow: WorkflowModel, options: Transactionable): object | Promise<object>;
  sync?: boolean;
}

export default Trigger;
