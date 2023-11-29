import path from 'path';

import { Transactionable } from '@nocobase/database';

import Plugin from '..';
import type { WorkflowModel } from '../types';

export abstract class Trigger {
  constructor(public readonly plugin: Plugin) {}
  abstract on(workflow: WorkflowModel): void;
  abstract off(workflow: WorkflowModel): void;
  duplicateConfig?(workflow: WorkflowModel, options: Transactionable): object | Promise<object>;
}

export default async function <T extends Trigger>(plugin, more: { [key: string]: { new (p: Plugin): T } } = {}) {
  const { triggers } = plugin;

  triggers.register('collection', new (await import(path.join(__dirname, 'collection'))).default(plugin));
  triggers.register('schedule', new (await import(path.join(__dirname, 'schedule'))).default(plugin));

  for (const [name, TClass] of Object.entries(more)) {
    triggers.register(name, new TClass(plugin));
  }
}
