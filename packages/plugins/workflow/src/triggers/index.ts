import { Registry } from '@nocobase/utils';
import WorkflowModel from '../models/Workflow';
import collectionlTrigger from './collection';

export interface Trigger {
  name: string;
  on(this: WorkflowModel, callback: Function): void;
  off(this: WorkflowModel): void;
}

export const triggers = new Registry<Trigger>();

export default triggers;

triggers.register(collectionlTrigger.name, collectionlTrigger);
