import WorkflowModel from '../models/Workflow';
import modelTrigger from './model';

export interface Trigger {
  name: string;
  on(this: WorkflowModel, callback: Function): void;
  off(this: WorkflowModel): void;
}

const triggers = new Map<string, Trigger>();

export function register(type: string, trigger: Trigger): void {
  triggers.set(type, trigger);
}

export function get(type: string): Trigger | undefined {
  return triggers.get(type);
}

register(modelTrigger.name, modelTrigger);
