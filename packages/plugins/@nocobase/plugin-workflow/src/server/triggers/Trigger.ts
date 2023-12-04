import { Transactionable } from '@nocobase/database';
import Plugin from '../Plugin';
import type { WorkflowModel } from '../types';

export default abstract class Trigger {
  constructor(public readonly plugin: Plugin) {}
  abstract on(workflow: WorkflowModel): void;
  abstract off(workflow: WorkflowModel): void;
  duplicateConfig?(workflow: WorkflowModel, options: Transactionable): object | Promise<object>;
}
