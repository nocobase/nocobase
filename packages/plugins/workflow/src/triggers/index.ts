import WorkflowModel from '../models/Workflow';
import Collection from './collection';
import Schedule from './schedule';

export interface Trigger {
  on(workflow: WorkflowModel): void;
  off(workflow: WorkflowModel): void;
}

export default function(plugin) {
  const { triggers } = plugin;
  triggers.register('collection', new Collection(plugin));
  triggers.register('schedule', new Schedule(plugin));
}
