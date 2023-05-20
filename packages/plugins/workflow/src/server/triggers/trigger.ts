import type Plugin from '..';
import type WorkflowModel from '../models/Workflow';

export abstract class Trigger {
  constructor(public readonly plugin: Plugin) {}
  abstract on(workflow: WorkflowModel): void;
  abstract off(workflow: WorkflowModel): void;
}
