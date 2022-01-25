import { ModelCtor } from '@nocobase/database';
import { WorkflowModel } from '../models/Workflow';
import * as dataChangeTriggers from './data-change';

export interface ITrigger {
  (this: ModelCtor<WorkflowModel>, config: any): void
}

const triggers = new Map<string, ITrigger>();

export function register(type: string, trigger: ITrigger): void {
  triggers.set(type, trigger);
}

export function get(type: string): ITrigger | undefined {
  return triggers.get(type);
}

for (const key in dataChangeTriggers) {
  if (dataChangeTriggers.hasOwnProperty(key)) {
    register(key, dataChangeTriggers[key]);
  }
}
