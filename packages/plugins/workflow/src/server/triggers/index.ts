import path from 'path';
import { requireModule } from '@nocobase/utils';

import Plugin from '..';
import WorkflowModel from '../models/Workflow';



export abstract class Trigger {
  constructor(public readonly plugin: Plugin) {}
  abstract on(workflow: WorkflowModel): void;
  abstract off(workflow: WorkflowModel): void;
}

export default function<T extends Trigger>(plugin, more: { [key: string]: { new(p: Plugin): T } } = {}) {
  const { triggers } = plugin;

  triggers.register('collection', new (requireModule(path.join(__dirname, 'collection')))(plugin));
  triggers.register('schedule', new (requireModule(path.join(__dirname, 'schedule')))(plugin));

  for (const [name, TClass] of Object.entries(more)) {
    triggers.register(name, new TClass(plugin));
  }
}
