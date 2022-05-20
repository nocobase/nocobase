import WorkflowModel from '../models/Workflow';
import Collection from './collection';
// import Schedule from './schedule';

export interface Trigger {
  on(workflow: WorkflowModel): void;
  off(workflow: WorkflowModel): void;
}

export default function({ triggers }) {
  triggers.register('collection', new Collection());
  // triggers.register('schedule', new Schedule());
}
